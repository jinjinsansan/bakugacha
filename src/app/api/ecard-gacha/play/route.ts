import { NextResponse } from 'next/server';
import { fetchEcardSettings } from '@/lib/data/ecard-gacha';
import { fetchProductById } from '@/lib/data/gacha';
import { getUserFromSession } from '@/lib/data/session';
import { deductCoins } from '@/lib/data/coins';
import { getServiceSupabase } from '@/lib/supabase/service';
import { buildGachaAssetPath } from '@/lib/gacha/assets';
import { generateScenario } from '@/lib/ecard-gacha/scenarios';
import type { EcardAxis } from '@/lib/ecard-gacha/types';

type EcardQuality = 'high' | 'low';

function pickWeightedAxis(
  weights: { axis: EcardAxis; rate: number }[],
): EcardAxis {
  const total = weights.reduce((a, b) => a + b.rate, 0);
  let r = Math.random() * total;
  for (const w of weights) {
    r -= w.rate;
    if (r <= 0) return w.axis;
  }
  return weights[weights.length - 1].axis;
}

function computeExpectationStars(star5Rate: number, star4Rate: number): number {
  const r = Math.random() * 100;
  if (r < star5Rate / 100 * star4Rate / 100 * 100) return 5;
  if (r < star5Rate) return 4;
  // Remaining spread across 1-3
  const remaining = 100 - star5Rate;
  const step = remaining / 3;
  if (r < star5Rate + step) return 3;
  if (r < star5Rate + step * 2) return 2;
  return 1;
}

function normalizeQuality(raw: unknown): EcardQuality {
  return raw === 'low' ? 'low' : 'high';
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const productId = typeof body?.productId === 'string' ? body.productId : null;
    const quality = normalizeQuality(body?.quality);

    const supabase = getServiceSupabase();
    const settings = await fetchEcardSettings(supabase);

    if (!settings.isActive) {
      return NextResponse.json(
        { success: false, error: 'ROYALカードガチャは現在準備中です。' },
        { status: 503 },
      );
    }

    // 商品・ユーザー情報を並行取得
    const [product, user] = await Promise.all([
      productId ? fetchProductById(supabase, productId) : Promise.resolve(null),
      getUserFromSession(supabase),
    ]);

    const price: number = product?.price ?? 0;

    // 管理者判定（コインチェック・消費をスキップ）
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

    // 勝敗決定
    const isWin = Math.random() * 100 < settings.winRate;

    // 軸選択
    let isDonten = false;
    let axis: EcardAxis;

    if (isWin) {
      // 当たり時: どんでん返し判定
      isDonten = Math.random() * 100 < settings.dontenRate;
      if (isDonten) {
        axis = 'C';
      } else {
        axis = pickWeightedAxis([
          { axis: 'A', rate: settings.axisARate },
          { axis: 'B', rate: settings.axisBRate },
          { axis: 'D', rate: settings.axisDRate },
          { axis: 'E', rate: settings.axisERate },
        ]);
      }
    } else {
      // ハズレ時: 軸C（どんでん返し）は除外
      axis = pickWeightedAxis([
        { axis: 'A', rate: settings.axisARate },
        { axis: 'B', rate: settings.axisBRate },
        { axis: 'D', rate: settings.axisDRate },
        { axis: 'E', rate: settings.axisERate },
      ]);
    }

    // ドロー数: 0〜4 のランダム
    const drawRounds = Math.floor(Math.random() * 5);

    // シナリオ生成
    const scenario = generateScenario(axis, isWin, isDonten, drawRounds);

    // 期待度★
    const expectationStars = computeExpectationStars(settings.star5Rate, settings.star4Rate);

    // コイン消費 & 結果保存（非同期・失敗しても結果は返す）
    if (user && productId) {
      const savePromises: Promise<unknown>[] = [];

      if (!isAdmin && price > 0) {
        savePromises.push(
          deductCoins(supabase, user.id as string, price, `ガチャ: ${product?.title ?? productId}`).catch(console.error),
        );
      }

      savePromises.push(
        Promise.resolve(
          supabase.from('gacha_results').insert({
            user_id: user.id,
            product_id: productId,
            result: scenario.isWin ? 'win' : 'loss',
            prize_name: product?.title ?? productId,
            coins_spent: price,
          }),
        ).then(({ error }) => { if (error) console.error('[gacha_results insert]', error); }),
      );

      await Promise.all(savePromises);

      // 在庫デクリメント & sold-out 自動化
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

    const baseFolder = quality === 'low' ? 'ecard-mobile' : 'ecard';

    return NextResponse.json({
      success: true,
      isWin: scenario.isWin,
      isDonten: scenario.isDonten,
      sequence: scenario.queue,
      videoBasePath: buildGachaAssetPath(baseFolder),
      expectationStars,
      scenarioCode: scenario.scenarioCode,
    });
  } catch (error) {
    console.error('[ecard-gacha/play]', error);
    return NextResponse.json(
      { success: false, error: '抽選に失敗しました。しばらくして再試行してください。' },
      { status: 500 },
    );
  }
}
