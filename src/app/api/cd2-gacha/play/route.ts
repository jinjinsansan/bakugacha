import { NextResponse } from 'next/server';
import { fetchCd2Settings } from '@/lib/data/cd2-gacha';
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

  if (isDonden) {
    // どんでん: 一度LOSSに見せてから逆転
    const fakeDecision = pickDecisionPoint();
    appendEnding(seq, fakeDecision, false);
    seq.push('donden');
    appendEnding(seq, pickDecisionPoint(), true);
  } else {
    appendEnding(seq, pickDecisionPoint(), isWin);
  }

  return seq;
}

export async function POST() {
  try {
    const supabase = getServiceSupabase();
    const settings = await fetchCd2Settings(supabase);

    if (!settings.isEnabled) {
      return NextResponse.json(
        { success: false, error: 'カウントダウンチャレンジ２は現在準備中です。' },
        { status: 503 },
      );
    }

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
