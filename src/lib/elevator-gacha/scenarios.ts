import type { ElevatorStep, ElevatorScenario } from './types';

// ── シナリオパターン ──────────────────────────────────────────

const WIN_STEPS: ElevatorStep[] = [
  'title', 'rise', 'stop', 'open_or_skip', 'open_coin', 'result_win',
];

const LOSE_STEPS: ElevatorStep[] = [
  'title', 'rise', 'stop', 'open_or_skip', 'open_hole', 'result_lose',
];

export function generateScenario(isWin: boolean): ElevatorScenario {
  return {
    isWin,
    steps: isWin ? [...WIN_STEPS] : [...LOSE_STEPS],
  };
}
