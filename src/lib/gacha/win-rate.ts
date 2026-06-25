/**
 * 景品表示法に基づく確率表示のための実効当選率算出。
 *
 * このサービスのガチャは「当たり / ハズレ」の二択。
 * 当選率は以下で決まる（src/app/api/cd2-gacha/play/route.ts と整合）:
 *   - 商品に win_rate_override がある場合 → その値（％）。どんでん返し等は適用されない。
 *   - cd2 共通設定の場合 → (100 - lossRate) + lossRate × dondenRate / 100
 *     （ハズレ判定後に dondenRate の確率で当たりに反転するため）
 *
 * 算出できない場合（データ不足）は null を返し、表示側で開示を控える。
 */
export interface WinRateResult {
  /** 当たり確率（％） */
  winRate: number;
  /** ハズレ確率（％） */
  lossRate: number;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** 小数1桁に丸める（整数は整数のまま） */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function computeWinRate(opts: {
  winRateOverride: number | null;
  gachaType: string;
  cd2Settings?: { lossRate: number; dondenRate: number } | null;
}): WinRateResult | null {
  const { winRateOverride, gachaType, cd2Settings } = opts;

  if (winRateOverride != null && Number.isFinite(winRateOverride)) {
    const w = round1(clamp(winRateOverride, 0, 100));
    return { winRate: w, lossRate: round1(100 - w) };
  }

  if (gachaType === 'cd2' && cd2Settings) {
    const loss = clamp(cd2Settings.lossRate, 0, 100);
    const donden = clamp(cd2Settings.dondenRate, 0, 100);
    const win = clamp((100 - loss) + (loss * donden) / 100, 0, 100);
    return { winRate: round1(win), lossRate: round1(100 - win) };
  }

  return null;
}
