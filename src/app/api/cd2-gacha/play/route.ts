import { NextResponse } from 'next/server';
import { fetchCd2Settings } from '@/lib/data/cd2-gacha';
import { fetchProductById } from '@/lib/data/gacha';
import { getUserFromSession } from '@/lib/data/session';
import { deductCoins } from '@/lib/data/coins';
import { getServiceSupabase } from '@/lib/supabase/service';
import { buildGachaAssetPath } from '@/lib/gacha/assets';
import type { Cd2Step } from '@/lib/cd2-gacha/types';

const WIN_STAR_WEIGHTS  = [5, 10, 20, 30, 35];
const LOSS_STAR_WEIGHTS = [25, 40, 35, 0, 0];

function pickWeighted(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i + 1;
  }
  return weights.length;
}

function computeExpectationStars(isWin: boolean, isDonden: boolean): number {
  return pickWeighted(isWin && !isDonden ? WIN_STAR_WEIGHTS : LOSS_STAR_WEIGHTS);
}

type DecisionPoint = 3 | 2 | 1 | 0;

function pickDecisionPoint(): DecisionPoint {
  const r = Math.random();
  if (r < 0.25) return 3;
  if (r < 0.50) return 2;
  if (r < 0.75) return 1;
  return 0;
}

function appendEnding(seq: Cd2Step[], decisionAt: DecisionPoint, isWin: boolean): void {
  const nums: DecisionPoint[] = [3, 2, 1, 0];
  for (const n of nums) {
    if (n > decisionAt) {
      seq.push(`red_${n}` as Cd2Step);
    } else {
      seq.push(isWin ? `red_${n}_win` : `red_${n}_loss` as Cd2Step);
      break;
    }
  }
}

function buildSequence(isWin: boolean, isDonden: boolean, isPatlite: boolean, isFreeze: boolean): Cd2Step[] {
  const seq: Cd2Step[] = ['standby', 'title_red'];

  if (isFreeze) {
    const stopAt = [1,2,3,4,5,6][Math.floor(Math.random() * 6)];
    const numbers = [10,9,8,7,6,5,4];
    for (let i = 0; i < stopAt && i < numbers.length; i++) {
      seq.push(`red_${numbers[i]}` as Cd2Step);
    }
    seq.push('jackpot', 'freeze');
    return seq;
  }

  for (let n = 10; n > 4; n--) seq.push(`red_${n}` as Cd2Step);

  if (isPatlite) seq.push('patlite');

  for (let n = 4; n > 3; n--) seq.push(`red_${n}` as Cd2Step);

  // どんでん返し: ハズレ演出 → patlite(自動) → donden(自動) → 2週目10→4 → 必ず当たり
  if (isDonden) {
    const lossAt = pickDecisionPoint();
    appendEnding(seq, lossAt, false);
    seq.push('patlite', 'donden');
    seq.push('red_10', 'red_9', 'red_8', 'red_7', 'red_6', 'red_5', 'red_4');
    appendEnding(seq, pickDecisionPoint(), true);
    return seq;
  } else {
    appendEnding(seq, pickDecisionPoint(), isWin);
  }

  return seq;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const productId = typeof body?.productId === 'string' ? body.productId : null;

    const supabase = getServiceSupabase();
    const settings = await fetchCd2Settings(supabase);

    if (!settings.isEnabled) {
      return NextResponse.json(
        { success: false, error: 'カウントダウンチャレンジ２は現在準備中です。' },
        { status: 503 },
      );
    }

    // 商品・ユーザー情報を並行取得
    const [product, user] = await Promise.all([
      productId ? fetchProductById(supabase, productId) : Promise.resolve(null),
      getUserFromSession(supabase),
    ]);

    const price: number = product?.price ?? 0;

    // コイン不足チェック
    if (price > 0) {
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
    const rawLoss = Math.random() * 100 < settings.lossRate;
    let isDonden = false;
    let isWin: boolean;

    if (rawLoss) {
      isDonden = Math.random() * 100 < settings.dondenRate;
      isWin = isDonden;
    } else {
      isWin = true;
    }

    let isFreeze = false;
    let isPatlite = false;
    if (isWin) {
      isFreeze = Math.random() * 100 < settings.freezeRate;
      if (!isFreeze) isPatlite = Math.random() * 100 < settings.patliteRate;
    }

    const sequence = buildSequence(isWin, isDonden, isPatlite, isFreeze);
    const expectationStars = computeExpectationStars(isWin, isDonden);

    // コイン消費 & 結果保存（非同期・失敗しても結果は返す）
    if (user && productId) {
      const savePromises: Promise<unknown>[] = [];

      if (price > 0) {
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
    }

    return NextResponse.json({
      success: true,
      isWin, isDonden, isPatlite, isFreeze, sequence,
      videoBasePath: buildGachaAssetPath('cd2'),
      expectationStars,
    });
  } catch (error) {
    console.error('[cd2-gacha/play]', error);
    return NextResponse.json(
      { success: false, error: '抽選に失敗しました。しばらくして再試行してください。' },
      { status: 500 },
    );
  }
}
