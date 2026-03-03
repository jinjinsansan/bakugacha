import type { EcardStep, EcardAxis, EcardCard, EcardScenario } from './types';

// ── 1ラウンド分の映像キュー生成 ─────────────────────────────────
// variant:
//   'win'  → 自分側カードを勝ちパターン映像にする (my_*_win)
//   'lose' → 相手側カードを負けパターン映像にする (opp_*_lose)
function buildRound(
  order: 'first' | 'second',
  myCard: EcardCard,
  oppCard: EcardCard,
  variant?: 'win' | 'lose',
): EcardStep[] {
  const myCardStep: EcardStep =
    variant === 'win' ? (`my_${myCard}_win` as EcardStep) : (`my_${myCard}` as EcardStep);
  const oppCardStep: EcardStep =
    variant === 'lose' ? (`opp_${oppCard}_lose` as EcardStep) : (`opp_${oppCard}` as EcardStep);

  const mySteps: EcardStep[] = ['my_blackout', 'my_card_back', myCardStep];
  const oppSteps: EcardStep[] = ['opp_blackout', 'opp_card_back', oppCardStep];

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
    steps.push(...buildRound('first', 'slave', 'emperor', 'win'));
  } else {
    steps.push(...buildRound('first', 'slave', 'citizen', 'lose'));
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
      steps.push(...buildRound('second', 'emperor', 'citizen', 'win'));
    } else {
      steps.push(...buildRound('second', 'citizen', 'slave', 'win'));
    }
  } else {
    steps.push(...buildRound('second', 'emperor', 'slave', 'lose'));
  }
  return steps;
}

// ── 軸C: どんでん返し（常に win） ─────────────────────────────
// 負けラウンド → donten → ドロー → 奴隷 vs 皇帝 (win)
function buildAxisC(drawRounds: number): EcardStep[] {
  const steps: EcardStep[] = [];
  // 最初に負けラウンド（物語上の演出 — 通常映像を使用）
  steps.push(...buildRound('first', 'citizen', 'emperor'));
  steps.push('lose');
  // どんでん返し映像
  steps.push('donten');
  // ドロー
  steps.push(...buildDrawRounds(drawRounds, 'first'));
  // 逆転勝利（勝ちパターン映像）
  steps.push(...buildRound('first', 'slave', 'emperor', 'win'));
  return steps;
}

// ── 軸D: 皇帝側先行 ──────────────────────────────────────────
// win: ドロー → 皇帝 vs 市民 (win)
// lose: ドロー → 皇帝 vs 奴隷 (lose)
function buildAxisD(isWin: boolean, drawRounds: number): EcardStep[] {
  const steps: EcardStep[] = [];
  steps.push(...buildDrawRounds(drawRounds, 'first'));
  if (isWin) {
    steps.push(...buildRound('first', 'emperor', 'citizen', 'win'));
  } else {
    steps.push(...buildRound('first', 'emperor', 'slave', 'lose'));
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
    steps.push(...buildRound('second', 'slave', 'emperor', 'win'));
  } else {
    steps.push(...buildRound('second', 'slave', 'citizen', 'lose'));
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
