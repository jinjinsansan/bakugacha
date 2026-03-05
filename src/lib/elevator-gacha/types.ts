// ── エレベーターガチャ 型定義（シンプル版） ─────────────────────

export type ElevatorStep =
  | 'title'
  | 'rise'
  | 'stop'
  | 'open_or_skip'
  | 'open_coin'
  | 'open_hole'
  | 'result_win'
  | 'result_lose';

/** autoAdvance=false のステップ（ユーザー操作待ち） */
export const PAUSE_STEPS: Set<ElevatorStep> = new Set(['open_or_skip']);

export interface ElevatorScenario {
  isWin: boolean;
  steps: ElevatorStep[];
}

export interface ElevatorSettings {
  id: string;
  isActive: boolean;
  winRate: number;
  chainLoseThreshold: number;
}
