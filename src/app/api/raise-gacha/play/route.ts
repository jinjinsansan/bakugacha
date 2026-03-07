import { NextResponse } from 'next/server';
import { fetchRaiseSettings } from '@/lib/data/raise-gacha';
import { fetchProductById } from '@/lib/data/gacha';
import { getUserFromSession } from '@/lib/data/session';
import { deductCoins } from '@/lib/data/coins';
import { issueRaiseCard } from '@/lib/data/raise-cards';
import { getServiceSupabase } from '@/lib/supabase/service';
import { buildGachaAssetPath } from '@/lib/gacha/assets';
import {
  drawStarLevel,
  pickCard,
  buildScenario,
  findDondenRoute,
  getCardDef,
} from '@/lib/raise-gacha/scenarios';
import type { RaiseCharacterId } from '@/lib/raise-gacha/types';

type RaiseQuality = 'high' | 'low';

function normalizeQuality(raw: unknown): RaiseQuality {
  return raw === 'low' ? 'low' : 'high';
}

function normalizeCharacterId(raw: unknown): RaiseCharacterId | null {
  if (raw === 'kenta' || raw === 'shoichi') return raw;
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const productId = typeof body?.productId === 'string' ? body.productId : null;
    const quality = normalizeQuality(body?.quality);
    const characterId = normalizeCharacterId(body?.characterId);

    if (!characterId) {
      return NextResponse.json(
        { success: false, error: 'キャラクターIDが不正です。' },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();
    const settings = await fetchRaiseSettings(supabase, characterId);

    if (!settings.isActive) {
      return NextResponse.json(
        { success: false, error: '来世ガチャは現在準備中です。' },
        { status: 503 },
      );
    }

    // 商品・ユーザー情報を並行取得
    const [product, user] = await Promise.all([
      productId ? fetchProductById(supabase, productId) : Promise.resolve(null),
      getUserFromSession(supabase),
    ]);

    const price: number = product?.price ?? 0;

    // 管理者判定
    const adminLineIds = (process.env.ADMIN_LINE_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const adminEmails  = (process.env.ADMIN_EMAILS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const isAdmin = (!!user?.line_user_id && adminLineIds.includes(user.line_user_id as string))
                 || (!!user?.email && adminEmails.includes(user.email as string));

    // 在庫切れチェック
    if (product && product.stock_remaining != null && product.stock_remaining <= 0) {
      return NextResponse.json(
        { success: false, error: 'この商品は売り切れです。' },
        { status: 400 },
      );
    }

    // コイン不足チェック（管理者はスキップ）
    if (!isAdmin && price > 0) {
      if (!user) {
        return NextResponse.json({ success: false, error: 'ログインが必要です。' }, { status: 401 });
      }
      const userCoins = (user.coins as number) ?? 0;
      if (userCoins < price) {
        return NextResponse.json(
          { success: false, error: `コインが不足しています。（必要: ${price}、所持: ${userCoins}）` },
          { status: 400 },
        );
      }
    }

    // 1. ハズレ判定
    const isLoss = Math.random() * 100 < settings.lossRate;

    // 2. ★抽選（当選時のみ実質的に使用、ハズレ時はダミー）
    const starLevel = drawStarLevel(settings.starDistribution);

    // 3. カード決定
    let cardId: string;
    let finalStarLevel: number;
    let hasDonden = false;
    let dondenRoute: ReturnType<typeof findDondenRoute> = undefined;

    if (isLoss) {
      cardId = 'hazure';
      finalStarLevel = 0;
    } else {
      const card = pickCard(characterId, starLevel);
      if (!card) {
        cardId = 'hazure';
        finalStarLevel = 0;
      } else {
        cardId = card.cardId;
        finalStarLevel = card.starLevel;

        // 4. どんでん判定
        if (Math.random() * 100 < settings.dondenRate) {
          const route = findDondenRoute(characterId, cardId);
          if (route) {
            hasDonden = true;
            dondenRoute = route;
            // どんでん時は最終カードがtoCardIdに変わる
            cardId = route.toCardId;
            const toCardDef = getCardDef(characterId, route.toCardId);
            if (toCardDef) {
              finalStarLevel = toCardDef.starLevel;
            }
          }
        }
      }
    }

    // 5. シナリオ構築
    const scenario = buildScenario(characterId, cardId, isLoss, hasDonden, dondenRoute);

    // 6. コイン消費 & 結果保存
    let gachaResultId: string | null = null;
    let cardData: {
      serialNumber: string;
      cardId: string;
      cardNumber: string;
      characterId: string;
      rarity: string;
      starLevel: number;
    } | null = null;

    if (user && productId) {
      const savePromises: Promise<unknown>[] = [];

      if (!isAdmin && price > 0) {
        savePromises.push(
          deductCoins(supabase, user.id as string, price, `ガチャ: ${product?.title ?? productId}`).catch(console.error),
        );
      }

      // gacha_results を insert して ID を取得
      const { data: resultRow, error: resultError } = await supabase
        .from('gacha_results')
        .insert({
          user_id: user.id,
          product_id: productId,
          result: isLoss ? 'loss' : 'win',
          prize_name: product?.title ?? productId,
          coins_spent: price,
        })
        .select('id')
        .single();

      if (resultError) {
        console.error('[gacha_results insert]', resultError);
      } else {
        gachaResultId = resultRow.id;
      }

      await Promise.all(savePromises);

      // カード発行
      if (gachaResultId) {
        const card = await issueRaiseCard(supabase, user.id as string, characterId, cardId, gachaResultId, settings);
        if (card) {
          cardData = {
            serialNumber: card.serialNumber,
            cardId: card.cardId,
            cardNumber: card.cardNumber,
            characterId: card.characterId,
            rarity: card.rarity,
            starLevel: card.starLevel,
          };
        }
      }

      // 在庫デクリメント
      if (product && product.stock_remaining != null) {
        const newRemaining = (product.stock_remaining as number) - 1;
        const update: Record<string, unknown> = { stock_remaining: newRemaining };
        if (newRemaining <= 0) update.status = 'sold-out';
        await supabase
          .from('gacha_products')
          .update(update)
          .eq('id', productId);
      }
    }

    const baseFolder = quality === 'low' ? `raise-${characterId}-mobile` : `raise-${characterId}`;

    return NextResponse.json({
      success: true,
      isLoss: scenario.isLoss,
      characterId: scenario.characterId,
      cardId: scenario.cardId,
      starLevel: scenario.starLevel,
      rarity: scenario.rarity,
      hasDonden: scenario.hasDonden,
      steps: scenario.steps,
      videoBasePath: buildGachaAssetPath(baseFolder),
      card: cardData,
    });
  } catch (error) {
    console.error('[raise-gacha/play]', error);
    return NextResponse.json(
      { success: false, error: '抽選に失敗しました。しばらくして再試行してください。' },
      { status: 500 },
    );
  }
}
