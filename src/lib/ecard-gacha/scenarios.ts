import type { EcardStep, EcardAxis, EcardCard, EcardScenario } from './types';

// ── ラウンド結果判定 ──────────────────────────────────────────
function resolveRound(myCard: EcardCard, oppCard: EcardCard): 'win' | 'lose' | 'draw' {
  if (myCard === oppCard) return 'draw';
  if (myCard === 'emperor' && oppCard === 'citizen') return 'win';
  if (myCard === 'emperor' && oppCard === 'slave') return 'lose';
  if (myCard === 'slave' && oppCard === 'emperor') return 'win';
  if (myCard === 'slave' && oppCard === 'citizen') return 'lose';
  if (myCard === 'citizen' && oppCard === 'slave') return 'win';
  if (myCard === 'citizen' && oppCard === 'emperor') return 'lose';
  return 'draw';
}

// ── 1ラウンド分の映像キュー生成 ─────────────────────────────────
function buildRound(
  order: 'first' | 'second',
  myCard: EcardCard,
  oppCard: EcardCard,
): EcardStep[] {
  const mySteps: EcardStep[] = ['my_blackout', 'my_card_back', `my_${myCard}` as EcardStep];
  const oppSteps: EcardStep[] = ['opp_blackout', 'opp_card_back', `opp_${oppCard}` as EcardStep];

  if (order === 'first') {
    return [...mySteps, ...oppSteps];
  }
  return [...oppSteps, ...mySteps];
}

// ── ドローラウンド（市民 vs 市民）の生成 ──────────────────────────
function buildDrawRounds(count: number, order: 'first' | 'second'): EcardStep[] {
  const steps: EcardStep[] = [];
  for (let i = 0; i < count; i++) {
    steps.push(...buildRound(order, 'citizen', 'citizen'));
    steps.push('draw');
  }
  return steps;
}

// ── 軸A: 奴隷側先行 ──────────────────────────────────────────
// win: ドロー → 奴隷 vs 皇帝 (win)
// lose: ドロー → 奴隷 vs 市民 (lose)
function buildAxisA(isWin: boolean, drawRounds: number): EcardStep[] {
  const steps: EcardStep[] = [];
  steps.push(...buildDrawRounds(drawRounds, 'first'));
  if (isWin) {
    steps.push(...buildRound('first', 'slave', 'emperor'));
    steps.push('win');
  } else {
    steps.push(...buildRound('first', 'slave', 'citizen'));
    steps.push('lose');
  }
  return steps;
}

// ── 軸B: 皇帝側後攻 ──────────────────────────────────────────
// win: ドロー → 皇帝 vs 市民 (win)  or  市民 vs 奴隷 (win)
// lose: ドロー → 皇帝 vs 奴隷 (lose)
function buildAxisB(isWin: boolean, drawRounds: number): EcardStep[] {
  const steps: EcardStep[] = [];
  steps.push(...buildDrawRounds(drawRounds, 'second'));
  if (isWin) {
    if (Math.random() < 0.5) {
      steps.push(...buildRound('second', 'emperor', 'citizen'));
    } else {
      steps.push(...buildRound('second', 'citizen', 'slave'));
    }
    steps.push('win');
  } else {
    steps.push(...buildRound('second', 'emperor', 'slave'));
    steps.push('lose');
  }
  return steps;
}

// ── 軸C: どんでん返し（常に win） ─────────────────────────────
// 負けラウンド → donten → ドロー → 奴隷 vs 皇帝 (win)
function buildAxisC(drawRounds: number): EcardStep[] {
  const steps: EcardStep[] = [];
  // 最初に負けラウンド
  steps.push(...buildRound('first', 'citizen', 'emperor'));
  steps.push('lose');
  // どんでん返し映像
  steps.push('donten');
  // ドロー
  steps.push(...buildDrawRounds(drawRounds, 'first'));
  // 逆転勝利
  steps.push(...buildRound('first', 'slave', 'emperor'));
  steps.push('win');
  return steps;
}

// ── 軸D: 皇帝側先行 ──────────────────────────────────────────
// win: ドロー → 皇帝 vs 市民 (win)
// lose: ドロー → 皇帝 vs 奴隷 (lose)
function buildAxisD(isWin: boolean, drawRounds: number): EcardStep[] {
  const steps: EcardStep[] = [];
  steps.push(...buildDrawRounds(drawRounds, 'first'));
  if (isWin) {
    steps.push(...buildRound('first', 'emperor', 'citizen'));
    steps.push('win');
  } else {
    steps.push(...buildRound('first', 'emperor', 'slave'));
    steps.push('lose');
  }
  return steps;
}

// ── 軸E: 奴隷側後攻 ──────────────────────────────────────────
// win: ドロー → 奴隷 vs 皇帝 (win)
// lose: ドロー → 奴隷 vs 市民 (lose)
function buildAxisE(isWin: boolean, drawRounds: number): EcardStep[] {
  const steps: EcardStep[] = [];
  steps.push(...buildDrawRounds(drawRounds, 'second'));
  if (isWin) {
    steps.push(...buildRound('second', 'slave', 'emperor'));
    steps.push('win');
  } else {
    steps.push(...buildRound('second', 'slave', 'citizen'));
    steps.push('lose');
  }
  return steps;
}

// ── シナリオ生成メイン ───────────────────────────────────────
export function generateScenario(
  axis: EcardAxis,
  isWin: boolean,
  isDonten: boolean,
  drawRounds: number,
): EcardScenario {
  const queue: EcardStep[] = ['standby', 'title'];

  let roundSteps: EcardStep[];
  switch (axis) {
    case 'A': roundSteps = buildAxisA(isWin, drawRounds); break;
    case 'B': roundSteps = buildAxisB(isWin, drawRounds); break;
    case 'C': roundSteps = buildAxisC(drawRounds); break;
    case 'D': roundSteps = buildAxisD(isWin, drawRounds); break;
    case 'E': roundSteps = buildAxisE(isWin, drawRounds); break;
  }
  queue.push(...roundSteps);

  // 最終結果映像
  const actualWin = axis === 'C' ? true : isWin;
  queue.push(actualWin ? 'final_win' : 'final_lose');

  const scenarioCode = `${axis}-${String(drawRounds).padStart(3, '0')}`;

  return {
    axis,
    scenarioCode,
    isWin: actualWin,
    isDonten,
    totalRounds: drawRounds + 1 + (axis === 'C' ? 1 : 0),
    queue,
  };
}
