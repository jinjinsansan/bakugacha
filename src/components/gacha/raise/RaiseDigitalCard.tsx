'use client';

import type { RaiseRarity, RaiseCharacterId } from '@/lib/raise-gacha/types';
import { getCardDef, getRaiseCardIllustUrl, rarityToCssClass } from '@/lib/raise-gacha/scenarios';
import type { RaiseCardRarity } from '@/lib/raise-gacha/scenarios';
import styles from './RaiseDigitalCard.module.css';

// ── Props ────────────────────────────────────────────────────

interface RaiseDigitalCardProps {
  characterId: RaiseCharacterId;
  cardId: string;
  serialNumber?: string;
  size?: 'full' | 'collection';
  cardRef?: React.Ref<HTMLDivElement>;
  onClick?: () => void;
}

// ── Helpers ──────────────────────────────────────────────────

function getRarityStyle(cssRarity: RaiseCardRarity): string {
  switch (cssRarity) {
    case 'rainbow':  return styles.rarityRainbow;
    case 'platinum': return styles.rarityPlatinum;
    case 'gold':     return styles.rarityGold;
    case 'silver':   return styles.raritySilver;
    case 'bronze':   return styles.rarityBronze;
    case 'simple':   return styles.raritySimple;
  }
}

function getRarityBadgeStyle(rarity: RaiseRarity): string {
  switch (rarity) {
    case 'LR':  return styles.rarityBadgeLR;
    case 'UR':  return styles.rarityBadgeUR;
    case 'SSR': return styles.rarityBadgeSSR;
    case 'SR':  return styles.rarityBadgeSR;
    case 'R':   return styles.rarityBadgeR;
    case 'N':   return styles.rarityBadgeN;
  }
}

function getStarClass(cssRarity: RaiseCardRarity): string {
  switch (cssRarity) {
    case 'rainbow':  return styles.starRainbow;
    case 'platinum': return styles.starPlatinum;
    case 'gold':     return styles.starGold;
    default:         return styles.starNormal;
  }
}

function getHoloOverlay(cssRarity: RaiseCardRarity): string | null {
  switch (cssRarity) {
    case 'rainbow':  return styles.holoRainbow;
    case 'platinum': return styles.holoPlatinum;
    case 'gold':     return styles.holoGold;
    default:         return null;
  }
}

const SPARKLE_CONFIGS = [
  { left: '18%', top: '28%', dur: '1.9s', delay: '0s',   sz: '5px' },
  { left: '72%', top: '18%', dur: '2.3s', delay: '0.5s', sz: '4px' },
  { left: '48%', top: '58%', dur: '1.6s', delay: '1.0s', sz: '5px' },
  { left: '82%', top: '68%', dur: '2.1s', delay: '0.3s', sz: '3px' },
  { left: '12%', top: '78%', dur: '1.7s', delay: '0.8s', sz: '4px' },
  { left: '8%',  top: '12%', dur: '1.2s', delay: '0s',   sz: '7px' },
  { left: '58%', top: '8%',  dur: '1.5s', delay: '0.3s', sz: '6px' },
  { left: '28%', top: '48%', dur: '1.8s', delay: '0.6s', sz: '5px' },
  { left: '38%', top: '28%', dur: '1.7s', delay: '0.4s', sz: '6px' },
];

// ── Component ────────────────────────────────────────────────

export function RaiseDigitalCard({
  characterId,
  cardId,
  serialNumber,
  size = 'full',
  cardRef,
  onClick,
}: RaiseDigitalCardProps) {
  const def = getCardDef(characterId, cardId);
  if (!def) return null;

  const cssRarity = rarityToCssClass(def.rarity);
  const illustUrl = getRaiseCardIllustUrl(def.illustFile);
  const holoClass = getHoloOverlay(cssRarity);
  const hasSparkles = cssRarity === 'rainbow' || cssRarity === 'platinum' || cssRarity === 'gold';
  const sparkleCount = cssRarity === 'rainbow' ? 9 : cssRarity === 'platinum' ? 7 : 5;
  const sizeClass = size === 'collection' ? styles.sizeCollection : styles.sizeFull;
  const cardIdText = serialNumber ?? def.cardNumber;
  const starCount = def.starLevel > 0 ? def.starLevel : 1;

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${getRarityStyle(cssRarity)} ${sizeClass}`}
      onClick={onClick}
    >
      <div className={styles.cardBevel} />
      <div className={styles.cardInner}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <div className={styles.cardName}>{def.name}</div>
          <div className={`${styles.cardRarity} ${getRarityBadgeStyle(def.rarity)}`}>
            {def.rarity}
          </div>
        </div>

        {/* Stars */}
        <div className={styles.cardStars}>
          {Array.from({ length: starCount }).map((_, i) => (
            <span key={i} className={`${styles.star} ${getStarClass(cssRarity)}`}>★</span>
          ))}
        </div>

        {/* Illustration */}
        <div
          className={styles.cardIllust}
          style={{ backgroundImage: `url(${illustUrl})` }}
        >
          {holoClass && <div className={holoClass} />}
          {hasSparkles && (
            <div className={styles.sparkles}>
              {SPARKLE_CONFIGS.slice(0, sparkleCount).map((s, i) => (
                <div
                  key={i}
                  className={styles.sparkle}
                  style={{
                    left: s.left, top: s.top,
                    '--dur': s.dur, '--delay': s.delay, '--sz': s.sz,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          )}
        </div>

        {/* Type */}
        <div className={styles.cardType}>{def.title}</div>

        {/* Effect */}
        <div className={styles.cardEffect}>
          <p>{def.effectText}</p>
        </div>

        {/* Stats */}
        <div className={styles.cardStats}>
          <div className={styles.stat}>ATK/<span>{def.atk}</span></div>
          <div className={styles.stat}>DEF/<span>{def.def}</span></div>
        </div>

        {/* Card ID / Serial */}
        <div className={styles.cardId}>{cardIdText}</div>
      </div>
      <div className={styles.cardSweep} />
    </div>
  );
}
