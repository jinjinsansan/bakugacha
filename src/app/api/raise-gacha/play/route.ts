export const runtime = 'nodejs';
export const maxDuration = 15;
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { fetchRaiseSettings } from '@/lib/data/raise-gacha';
import { fetchProductById } from '@/lib/data/gacha';
import { getUserFromSession } from '@/lib/data/session';
import { getServiceSupabase } from '@/lib/supabase/service';
import { buildGachaAssetPath } from '@/lib/gacha/assets';
import { callPlayGacha, mapPlayGachaError } from '@/lib/data/play-gacha';
import { checkGachaRateLimit, getClientIp } from '@/lib/ratelimit-db';
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

    // Rate limit: 10秒に10回まで
    const rl = await checkGachaRateLimit(supabase, getClientIp(request));
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'リクエストが多すぎます。しばらく待ってから再試行してください。' },
        { status: 429 },
      );
    }

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

    // 商品別当選率のオーバーライド (null なら共通設定を使用)
    // win_rate_override が設定されている場合、lossRate = 100 - win_rate_override として扱う
    const winRateOverride = product?.win_rate_override != null ? Number(product.win_rate_override) : null;
    const effectiveLossRate = winRateOverride != null
      ? Math.max(0, Math.min(100, 100 - winRateOverride))
      : settings.lossRate;

    // 1. ハズレ判定
    const isLoss = Math.random() * 100 < effectiveLossRate;

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

    // ── 6. 原子的ガチャ実行 (migration 019 の play_gacha RPC) ──
    let cardData: {
      serialNumber: string;
      cardId: string;
      cardNumber: string;
      characterId: string;
      rarity: string;
      starLevel: number;
    } | null = null;

    if (user && productId) {
      const cardDef = getCardDef(characterId, cardId);

      const rpcResult = await callPlayGacha(supabase, {
        userId: user.id as string,
        productId,
        price,
        isAdmin,
        result: isLoss ? 'loss' : 'win',
        prizeName: product?.title ?? productId,
        cardInfo: cardDef
          ? {
              type: 'raise',
              character_id: characterId,
              card_id: cardId,
              card_number: cardDef.cardNumber,
              rarity: cardDef.rarity,
              star_level: cardDef.starLevel,
              max_issuance: settings.cardMaxIssuance?.[cardId] ?? 0,
            }
          : null,
        createPrizeClaim: false,
      });

      if (!rpcResult.success) {
        return NextResponse.json(
          { success: false, error: mapPlayGachaError(rpcResult.error_code) },
          { status: 400 },
        );
      }

      if (rpcResult.card_serial && cardDef) {
        cardData = {
          serialNumber: rpcResult.card_serial,
          cardId,
          cardNumber: cardDef.cardNumber,
          characterId,
          rarity: cardDef.rarity,
          starLevel: cardDef.starLevel,
        };
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
      starDisplay: scenario.starDisplay,
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
