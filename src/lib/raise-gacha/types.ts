// ── 来世ガチャ 型定義 ─────────────────────────────────────────

export type RaiseCharacterId = 'kenta' | 'shoichi';

export type RaiseRarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR' | 'LR';

export interface RaiseStep {
  name: string;
  file: string;
  autoAdvance?: boolean;
}

export interface RaiseScenario {
  characterId: RaiseCharacterId;
  isLoss: boolean;
  cardId: string;
  starLevel: number;
  rarity: RaiseRarity;
  hasDonden: boolean;
  steps: RaiseStep[];
}

export interface RaiseSettings {
  id: string;
  isActive: boolean;
  /** ハズレ率（%） */
  lossRate: number;
  /** ★1-12の出現ウェイト（12要素） */
  starDistribution: number[];
  /** どんでん返し発動率（%） */
  dondenRate: number;
  /** カード別最大発行枚数: {"c01":100,...} 0=無制限 */
  cardMaxIssuance: Record<string, number>;
}

export interface RaiseCardDef {
  cardId: string;
  name: string;
  title: string;
  rarity: RaiseRarity;
  starLevel: number;
  mainSceneSteps: number;
  cardNumber: string;
  illustFile: string;
  effectText: string;
  atk: number;
  def: number;
}

export interface RaiseDondenRoute {
  fromCardId: string;
  toCardId: string;
}

export interface RaiseCardIssued {
  id: string;
  userId: string;
  gachaResultId: string | null;
  characterId: string;
  cardId: string;
  serialNumber: string;
  serialSeq: number;
  cardNumber: string;
  rarity: string;
  starLevel: number;
  issuedAt: string;
}
