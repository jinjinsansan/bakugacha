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
  /** コース別当たり確率（%）: {"01":60,"02":45,...,"07":75} */
  courseWinRates: Record<string, number>;
  /** コース別出現率（%）: {"01":30,"02":20,...} */
  courseAppearanceRates: Record<string, number>;
  /** キャラ別出現率（ウェイト） */
  charaRates: Record<string, number>;
  /** キャラ×コース補正（%加算）: {"aoikaze":{"01":20,"07":-10},...} */
  charaCourseBonuses: Record<string, Record<string, number>>;
  /** 馬親父出現時の当たり確率（%）— courseWinRatesより優先 */
  umaoyajiWinRate: number;
  /** バクガチャヒメの当たり確率 下限保証（%） */
  bakugachahimeWinRate: number;
  /** フワリンの当たり確率 上限（%） */
  fuwarinWinRate: number;
  /** 連続ハズレ強制当たり閾値 */
  chainLoseThreshold: number;
}
