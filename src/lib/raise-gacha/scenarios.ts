// ── 来世ガチャ シナリオエンジン ─────────────────────────────────
import type { RaiseCharacterId, RaiseStep, RaiseScenario, RaiseCardDef, RaiseDondenRoute, RaiseRarity } from './types';
import { KENTA_CARD_MAP, ALL_KENTA_CARDS, KENTA_DONDEN_ROUTES, getKentaCardByStarLevel } from './cards-kenta';
import { SHOICHI_CARD_MAP, ALL_SHOICHI_CARDS, SHOICHI_DONDEN_ROUTES, getShoichiCardByStarLevel } from './cards-shoichi';
import { weightedRandomIndex, pickRandom } from './utils';

// ── ヘルパー ──────────────────────────────────────────────────

function getCardMap(characterId: RaiseCharacterId) {
  return characterId === 'kenta' ? KENTA_CARD_MAP : SHOICHI_CARD_MAP;
}

function getAllCards(characterId: RaiseCharacterId) {
  return characterId === 'kenta' ? ALL_KENTA_CARDS : ALL_SHOICHI_CARDS;
}

function getDondenRoutes(characterId: RaiseCharacterId): RaiseDondenRoute[] {
  return characterId === 'kenta' ? KENTA_DONDEN_ROUTES : SHOICHI_DONDEN_ROUTES;
}

function getCardByStarLevel(characterId: RaiseCharacterId, starLevel: number): RaiseCardDef | undefined {
  return characterId === 'kenta' ? getKentaCardByStarLevel(starLevel) : getShoichiCardByStarLevel(starLevel);
}

// ── レアリティ → CSSクラスマッピング ──────────────────────────

export type RaiseCardRarity = 'simple' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'rainbow';

export function rarityToCssClass(rarity: RaiseRarity): RaiseCardRarity {
  switch (rarity) {
    case 'N':   return 'simple';
    case 'R':   return 'bronze';
    case 'SR':  return 'silver';
    case 'SSR': return 'gold';
    case 'UR':  return 'platinum';
    case 'LR':  return 'rainbow';
  }
}

// ── 期待度★選択（tensei title-video-selector 準拠） ────────────

/** タイトル映像中に表示する期待度★（1-5）を重み付きランダムで決定 */
export function selectTitleStars(isRealCard: boolean): number {
  // isRealCard=true: 4-5★ に偏る / false: 1-2★ に偏る（どんでんミスリード）
  const weights = isRealCard ? [5, 10, 15, 35, 35] : [30, 30, 20, 15, 5];
  return weightedRandomIndex(weights) + 1;
}

// ── Pre-scene パターン ─────────────────────────────────────────

const PRE_PATTERNS = ['a', 'b', 'c', 'd'] as const;

// ── 公開関数 ──────────────────────────────────────────────────

/** ★分布に基づいて★レベルを決定（1-12） */
export function drawStarLevel(distribution: number[]): number {
  const idx = weightedRandomIndex(distribution);
  return idx + 1; // 0-indexed → 1-12
}

/** ★レベルからカードを取得 */
export function pickCard(characterId: RaiseCharacterId, starLevel: number): RaiseCardDef | undefined {
  return getCardByStarLevel(characterId, starLevel);
}

/** カード情報取得 */
export function getCardDef(characterId: RaiseCharacterId, cardId: string): RaiseCardDef | undefined {
  return getCardMap(characterId).get(cardId);
}

/** 全カード取得 */
export function getCards(characterId: RaiseCharacterId): RaiseCardDef[] {
  return getAllCards(characterId);
}

/** どんでんルートから当該カードの上位ルートを探す */
export function findDondenRoute(characterId: RaiseCharacterId, fromCardId: string): RaiseDondenRoute | undefined {
  const routes = getDondenRoutes(characterId);
  const candidates = routes.filter((r) => r.fromCardId === fromCardId);
  if (candidates.length === 0) return undefined;
  return pickRandom(candidates);
}

/** ハズレ時のデコイカード（映像演出用）をランダムに選ぶ */
function pickDecoyCard(characterId: RaiseCharacterId): RaiseCardDef {
  const cards = getAllCards(characterId).filter((c) => c.cardId !== 'hazure' && c.mainSceneSteps > 0);
  return pickRandom(cards);
}

/**
 * シナリオ構築
 * - ハズレ時: デコイカードの映像を流す → 最後にハズレカード表示（ドキドキ感を演出）
 * - 当選時: TITLE → PRE × 2 → CHANCE → MAIN → カード表示
 * - どんでん: fromCardの映像 → どんでん映像 → toCardで表示
 */
export function buildScenario(
  characterId: RaiseCharacterId,
  cardId: string,
  isLoss: boolean,
  hasDonden: boolean,
  dondenRoute?: RaiseDondenRoute,
): RaiseScenario {
  const char = characterId;
  const cardMap = getCardMap(characterId);

  // 表示するカード
  const resultCard = cardMap.get(cardId)!;

  // 映像に使うカード
  // ハズレ: デコイ（ランダムカード）/ どんでん: fromCard / 通常: resultCard
  let videoCard: RaiseCardDef;
  if (isLoss) {
    videoCard = pickDecoyCard(characterId);
  } else if (hasDonden && dondenRoute) {
    videoCard = cardMap.get(dondenRoute.fromCardId) ?? resultCard;
  } else {
    videoCard = resultCard;
  }

  const steps: RaiseStep[] = [];

  // 1. TITLE
  steps.push({
    name: 'title',
    file: `${char}_title_${videoCard.cardId}.mp4`,
  });

  // 2. PRE (2 steps) — ランダムなパターン(a-d)
  const prePattern = pickRandom([...PRE_PATTERNS]);
  steps.push({
    name: 'pre1',
    file: `${char}_pre_${prePattern}1.mp4`,
  });
  steps.push({
    name: 'pre2',
    file: `${char}_pre_${prePattern}2.mp4`,
  });

  // 3. CHANCE
  steps.push({
    name: 'chance',
    file: `${char}_chance_${prePattern}.mp4`,
  });

  // 4. MAIN (2-5 steps) — mainStepNumbers があれば欠番に対応
  const stepNumbers = videoCard.mainStepNumbers
    ?? Array.from({ length: videoCard.mainSceneSteps }, (_, i) => i + 1);
  for (const n of stepNumbers) {
    steps.push({
      name: `main${n}`,
      file: `${char}_${videoCard.cardId}_${n}.mp4`,
    });
  }

  // 5. DONDEN (optional, 2 steps)
  if (hasDonden && dondenRoute) {
    steps.push({
      name: 'donden1',
      file: `${char}_rev_${dondenRoute.fromCardId}_${dondenRoute.toCardId}_1.mp4`,
    });
    steps.push({
      name: 'donden2',
      file: `${char}_rev_${dondenRoute.fromCardId}_${dondenRoute.toCardId}_2.mp4`,
      autoAdvance: true,
    });
  }

  // 6. 最後の main ステップに autoAdvance を設定（どんでんなし時）
  if (steps.length > 0 && !hasDonden) {
    steps[steps.length - 1].autoAdvance = true;
  }

  // ハズレ・どんでん: デコイ/fromCard映像 → ミスリード低★ / 通常当選: 高★
  const starDisplay = selectTitleStars(!isLoss && !hasDonden);

  return {
    characterId,
    isLoss,
    cardId: resultCard.cardId,
    starLevel: resultCard.starLevel,
    rarity: resultCard.rarity,
    hasDonden,
    steps,
    starDisplay,
  };
}

/** カードイラストのR2パスを組み立て */
export function getRaiseCardIllustUrl(illustFile: string): string {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.replace(/\/+$/, '') ?? '';
  return `${base}/raise-cards/${illustFile}`;
}
