// ── 競馬ガチャ 型定義 ─────────────────────────────────────────

export interface KeibaStep {
  name: string;
  file: string;
}

export interface KeibaScenario {
  isWin: boolean;
  charaId: string;          // イントロキャラ
  courseId: string;          // ファンファーレコース
  resultCharaId: string;    // 勝利キャラ（カード発行対象）
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
  /** ★が正直な期待度を示す確率（%）。残り%はランダムミスリード */
  starHonestRate: number;
  /** キャラ別カード最大発行枚数: {"shirogane":100,...} 0=無制限 */
  cardMaxIssuance: Record<string, number>;
  /** どんでん返し全体の発動率（%） */
  dontenRate: number;
  /** どんでん上振れ割合（%） */
  dontenUpRate: number;
  /** どんでん下振れ割合（%） */
  dontenDownRate: number;
  /** どんでんコメディ割合（%） */
  dontenComedyRate: number;
}

export interface KeibaCardIssued {
  id: string;
  userId: string;
  gachaResultId: string | null;
  charaId: string;
  serialNumber: string;
  serialSeq: number;
  cardNumber: string;
  issuedAt: string;
}
