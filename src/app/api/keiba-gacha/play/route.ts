import { NextResponse } from 'next/server';
import { fetchKeibaSettings } from '@/lib/data/keiba-gacha';
import { fetchProductById } from '@/lib/data/gacha';
import { getUserFromSession } from '@/lib/data/session';
import { deductCoins } from '@/lib/data/coins';
import { issueCard } from '@/lib/data/keiba-cards';
import { getServiceSupabase } from '@/lib/supabase/service';
import { buildGachaAssetPath } from '@/lib/gacha/assets';
import {
  pickCharacter,
  pickFanfareCourse,
  getEffectiveWinRate,
  generateScenario,
  getCharaName,
  getCharaWeight,
} from '@/lib/keiba-gacha/scenarios';
import {
  rollDontenType,
  selectDontenPattern,
  buildDontenScenario,
} from '@/lib/keiba-gacha/scenario-patterns';
import type { KeibaScenario } from '@/lib/keiba-gacha/types';

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

    // 1. ファンファーレコース抽選（全キャラ共通、重み付き）
    const fanfareCourse = pickFanfareCourse(settings);

    // 2. キャラ抽選
    const chara = pickCharacter(settings);

    // 3. 連続ハズレ強制当たり判定
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

    // 4. どんでん返し抽選
    let scenario: KeibaScenario | null = null;
    let forcedStar: number | null = null;

    const isDonten = Math.random() * 100 < settings.dontenRate;

    if (isDonten) {
      const dontenType = rollDontenType(
        settings.dontenUpRate,
        settings.dontenDownRate,
        settings.dontenComedyRate,
      );

      // forcedWin 時に down/comedy は無効化 → 上振れに変換
      const effectiveType = (forcedWin && dontenType !== 'up') ? 'up' : dontenType;

      const pattern = selectDontenPattern(fanfareCourse.id, chara.id, effectiveType, settings.dontenPatternWeights);

      if (pattern) {
        // forcedWin なのにパターンがハズレの場合はスキップ（通常フローにフォールバック）
        if (forcedWin && !pattern.isWin) {
          // フォールバック
        } else {
          scenario = buildDontenScenario(pattern);
          forcedStar = pattern.forcedStar;
        }
      }
    }

    // 通常フロー（どんでん不発 or パターンなし）
    if (!scenario) {
      const effectiveWinRate = getEffectiveWinRate(chara.id, fanfareCourse.id, settings);
      const isWin = forcedWin || Math.random() * 100 < effectiveWinRate;
      scenario = generateScenario(isWin, chara.id, fanfareCourse.id);
    }

    // 7. コイン消費 & 結果保存
    let gachaResultId: string | null = null;
    let cardData: { serialNumber: string; charaId: string; cardNumber: string } | null = null;

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
          result: scenario.isWin ? 'win' : 'loss',
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

      // カード発行（当選=resultCharaIdのカード、ハズレ=ハズレカード）
      if (gachaResultId) {
        const cardCharaId = scenario.isWin ? scenario.resultCharaId : 'hazure';
        const card = await issueCard(supabase, user.id as string, cardCharaId, gachaResultId, settings);
        if (card) {
          cardData = {
            serialNumber: card.serialNumber,
            charaId: card.charaId,
            cardNumber: card.cardNumber,
          };
        }
      }

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

    // ★決定（forcedStar があれば優先、なければ通常ロジック）
    const expectationStars = forcedStar ?? pickStar(fanfareCourse.id, settings.starHonestRate);

    // レース情報
    const raceName = RACE_NAMES[Math.floor(Math.random() * RACE_NAMES.length)];
    const distPool = DISTANCE_BY_COURSE[fanfareCourse.id] ?? DISTANCES_TURF;
    const distance = `${distPool[Math.floor(Math.random() * distPool.length)]}m`;
    const trackCondition = TRACK_CONDITION[fanfareCourse.id] ?? '芝・良';

    const baseFolder = quality === 'low' ? 'keiba-mobile' : 'keiba';

    return NextResponse.json({
      success: true,
      isWin: scenario.isWin,
      charaId: scenario.charaId,
      courseId: scenario.courseId,
      resultCharaId: scenario.resultCharaId,
      resultCharaName: getCharaName(scenario.resultCharaId),
      charaName: getCharaName(chara.id),
      charaWeight: getCharaWeight(chara.id),
      expectationStars,
      raceName,
      distance,
      trackCondition,
      steps: scenario.steps,
      videoBasePath: buildGachaAssetPath(baseFolder),
      card: cardData,
    });
  } catch (error) {
    console.error('[keiba-gacha/play]', error);
    return NextResponse.json(
      { success: false, error: '抽選に失敗しました。しばらくして再試行してください。' },
      { status: 500 },
    );
  }
}
