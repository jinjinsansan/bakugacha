import { NextResponse } from 'next/server';
import { fetchKeibaSettings } from '@/lib/data/keiba-gacha';
import { fetchProductById } from '@/lib/data/gacha';
import { getUserFromSession } from '@/lib/data/session';
import { deductCoins } from '@/lib/data/coins';
import { getServiceSupabase } from '@/lib/supabase/service';
import { buildGachaAssetPath } from '@/lib/gacha/assets';
import {
  pickCharacter,
  pickCourse,
  getEffectiveWinRate,
  generateScenario,
  getCharaName,
  getCharaWeight,
} from '@/lib/keiba-gacha/scenarios';

// ── レース名リスト（30種） ────────────────────────────────────
const RACE_NAMES = [
  '東京ダービー', '中山記念', '阪神大賞典', '京都金杯', '有馬記念',
  '天皇賞・春', '天皇賞・秋', 'ジャパンカップ', '宝塚記念', '桜花賞',
  '皐月賞', 'オークス', '菊花賞', '秋華賞', 'スプリンターズS',
  'マイルCS', 'エリザベス女王杯', 'チャンピオンズC', 'フェブラリーS', '高松宮記念',
  '安田記念', 'NHKマイルC', 'ヴィクトリアマイル', '大阪杯', '日本ダービー',
  '函館記念', '小倉記念', '新潟大賞典', '中京記念', '福島記念',
];

// ── コース別 馬場状態・距離プール ─────────────────────────────
const TRACK_CONDITION: Record<string, string> = {
  '01': '芝・良', '02': 'ダート・良', '03': '芝・稍重',
  '04': 'ダート・稍重', '05': '芝・重', '06': '芝・重', '07': 'ダート・重',
};
const DISTANCES_TURF  = [1600, 2000, 2400, 3200];
const DISTANCES_DIRT  = [1200, 1600, 2000];
const DISTANCE_BY_COURSE: Record<string, number[]> = {
  '01': DISTANCES_TURF, '02': DISTANCES_DIRT, '03': DISTANCES_TURF,
  '04': DISTANCES_DIRT, '05': DISTANCES_TURF, '06': DISTANCES_TURF, '07': DISTANCES_DIRT,
};

// ── ★ミスリード設計 ──────────────────────────────────────────
const HONEST_STAR: Record<string, number[]> = {
  '01': [4], '02': [3], '03': [2, 3], '04': [2], '05': [1], '06': [4, 5], '07': [6],
};
function pickStar(courseId: string, starHonestRate: number): number {
  const pool = HONEST_STAR[courseId] ?? [3];
  const honest = pool[Math.floor(Math.random() * pool.length)];
  if (Math.random() * 100 < starHonestRate) return honest;
  return Math.floor(Math.random() * 6) + 1; // 1〜6 (6=★MAX)
}

type KeibaQuality = 'high' | 'low';

function normalizeQuality(raw: unknown): KeibaQuality {
  return raw === 'low' ? 'low' : 'high';
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const productId = typeof body?.productId === 'string' ? body.productId : null;
    const quality = normalizeQuality(body?.quality);

    const supabase = getServiceSupabase();
    const settings = await fetchKeibaSettings(supabase);

    if (!settings.isActive) {
      return NextResponse.json(
        { success: false, error: '競馬ガチャは現在準備中です。' },
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

    // 1. キャラ抽選
    const chara = pickCharacter(settings);

    // 2. コース抽選（馬親父=01固定、他=出現率テーブルで重み付き抽選）
    const course = pickCourse(chara.id, settings);

    // 3. コース別当たり率 + キャラ×コース補正 → 実効当たり率を算出
    const effectiveWinRate = getEffectiveWinRate(chara.id, course.id, settings);

    // 4. 連続ハズレ強制当たり判定
    let forcedWin = false;
    if (user && settings.chainLoseThreshold > 0) {
      const { data: recentResults } = await supabase
        .from('gacha_results')
        .select('result')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(settings.chainLoseThreshold);
      if (
        recentResults &&
        recentResults.length >= settings.chainLoseThreshold &&
        recentResults.every((r: { result: string }) => r.result === 'loss')
      ) {
        forcedWin = true;
      }
    }

    // 5. 勝敗決定（コース別当たり率 + キャラ補正適用）
    const isWin = forcedWin || Math.random() * 100 < effectiveWinRate;

    // 6. シナリオ生成（タイトル動画選択 + ステップ配列）
    const scenario = generateScenario(isWin, chara.id, course.id);

    // 7. コイン消費 & 結果保存
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
            result: isWin ? 'win' : 'loss',
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

    // ★ミスリード設計（仕様書: 60%正直・40%ランダム）
    const expectationStars = pickStar(course.id, settings.starHonestRate);

    // レース情報
    const raceName = RACE_NAMES[Math.floor(Math.random() * RACE_NAMES.length)];
    const distPool = DISTANCE_BY_COURSE[course.id] ?? DISTANCES_TURF;
    const distance = `${distPool[Math.floor(Math.random() * distPool.length)]}m`;
    const trackCondition = TRACK_CONDITION[course.id] ?? '芝・良';

    const baseFolder = quality === 'low' ? 'keiba-mobile' : 'keiba';

    return NextResponse.json({
      success: true,
      isWin: scenario.isWin,
      charaId: scenario.charaId,
      courseId: scenario.courseId,
      charaName: getCharaName(chara.id),
      charaWeight: getCharaWeight(chara.id),
      expectationStars,
      raceName,
      distance,
      trackCondition,
      steps: scenario.steps,
      videoBasePath: buildGachaAssetPath(baseFolder),
    });
  } catch (error) {
    console.error('[keiba-gacha/play]', error);
    return NextResponse.json(
      { success: false, error: '抽選に失敗しました。しばらくして再試行してください。' },
      { status: 500 },
    );
  }
}
