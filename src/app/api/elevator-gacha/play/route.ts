export const runtime = 'nodejs';
export const maxDuration = 15;
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { fetchElevatorSettings } from '@/lib/data/elevator-gacha';
import { fetchProductById } from '@/lib/data/gacha';
import { getUserFromSession } from '@/lib/data/session';
import { getServiceSupabase } from '@/lib/supabase/service';
import { buildGachaAssetPath } from '@/lib/gacha/assets';
import { generateScenario } from '@/lib/elevator-gacha/scenarios';
import { callPlayGacha, mapPlayGachaError } from '@/lib/data/play-gacha';
import { checkGachaRateLimit, getClientIp } from '@/lib/ratelimit-db';

type ElevatorQuality = 'high' | 'low';

function normalizeQuality(raw: unknown): ElevatorQuality {
  return raw === 'low' ? 'low' : 'high';
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const productId = typeof body?.productId === 'string' ? body.productId : null;
    const quality = normalizeQuality(body?.quality);

    const supabase = getServiceSupabase();

    // Rate limit: 10秒に10回まで
    const rl = await checkGachaRateLimit(supabase, getClientIp(request));
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'リクエストが多すぎます。しばらく待ってから再試行してください。' },
        { status: 429 },
      );
    }

    const settings = await fetchElevatorSettings(supabase);

    if (!settings.isActive) {
      return NextResponse.json(
        { success: false, error: 'エレベーターガチャは現在準備中です。' },
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

    // 連続ハズレ強制当たり判定
    let forcedWin = false;
    if (user && settings.chainLoseThreshold > 0) {
      const { data: recentResults } = await supabase
        .from('gacha_results')
        .select('result')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(settings.chainLoseThreshold);
      if (
        recentResults &&
        recentResults.length >= settings.chainLoseThreshold &&
        recentResults.every((r: { result: string }) => r.result === 'loss')
      ) {
        forcedWin = true;
      }
    }

    // 商品別当選率のオーバーライド (null なら共通設定を使用)
    const winRateOverride = product?.win_rate_override != null ? Number(product.win_rate_override) : null;
    const effectiveWinRate = winRateOverride != null
      ? Math.max(0, Math.min(100, winRateOverride))
      : settings.winRate;

    // 勝敗決定
    const isWin = forcedWin || Math.random() * 100 < effectiveWinRate;

    // シナリオ生成
    const scenario = generateScenario(isWin);

    // ── 原子的ガチャ実行 (migration 019 の play_gacha RPC) ──
    if (user && productId) {
      const rpcResult = await callPlayGacha(supabase, {
        userId: user.id as string,
        productId,
        price,
        isAdmin,
        result: isWin ? 'win' : 'loss',
        prizeName: product?.title ?? productId,
        cardInfo: null,
        createPrizeClaim: false,
      });

      if (!rpcResult.success) {
        return NextResponse.json(
          { success: false, error: mapPlayGachaError(rpcResult.error_code) },
          { status: 400 },
        );
      }
    }

    const baseFolder = quality === 'low' ? 'elevator-mobile' : 'elevator';

    return NextResponse.json({
      success: true,
      isWin: scenario.isWin,
      steps: scenario.steps,
      videoBasePath: buildGachaAssetPath(baseFolder),
    });
  } catch (error) {
    console.error('[elevator-gacha/play]', error);
    return NextResponse.json(
      { success: false, error: '抽選に失敗しました。しばらくして再試行してください。' },
      { status: 500 },
    );
  }
}
