// ── 競馬ガチャ 型定義 ─────────────────────────────────────────

export interface KeibaStep {
  name: string;
  file: string;
}

export interface KeibaScenario {
  isWin: boolean;
  charaId: string;
  courseId: string;
  steps: KeibaStep[];
}

export interface KeibaSettings {
  id: string;
  isActive: boolean;
  winRate: number;
  umaoyajiWinRate: number;
  bakugachahimeWinRate: number;
  fuwarinWinRate: number;
  charaRates: Record<string, number>;
  courseRates: Record<string, number>;
  chainLoseThreshold: number;
}
