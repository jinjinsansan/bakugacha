'use client';

import { useMemo } from 'react';
import type { KeibaCardDef, CardRarity } from '@/lib/keiba-gacha/cards';
import { KEIBA_CARD_MAP, getCardIllustUrl } from '@/lib/keiba-gacha/cards';
import styles from './KeibaDigitalCard.module.css';

// ── Props ────────────────────────────────────────────────────

interface KeibaDigitalCardProps {
  /** カードのcharaId — KEIBA_CARD_MAPから定義を引く */
  charaId: string;
  /** シリアルナンバー（e.g. KG24-JP001-0042）。無い場合はcardNumberのみ */
  serialNumber?: string;
  /** 'full' (295×430) or 'collection' (148×215) */
  size?: 'full' | 'collection';
  /** html2canvas 用 ref callback */
  cardRef?: React.Ref<HTMLDivElement>;
  onClick?: () => void;
}

// ── Helpers ──────────────────────────────────────────────────

function getRarityStyle(rarity: CardRarity): string {
  switch (rarity) {
    case 'rainbow': return styles.rarityRainbow;
    case 'gold':    return styles.rarityGold;
    case 'silver':  return styles.raritySilver;
    case 'bronze':  return styles.rarityBronze;
    case 'simple':  return styles.raritySimple;
  }
}

function getAttrStyle(attr: KeibaCardDef['attribute']): string {
  switch (attr) {
    case 'light': return styles.attrLight;
    case 'dark':  return styles.attrDark;
    case 'wind':  return styles.attrWind;
    case 'fire':  return styles.attrFire;
    case 'earth': return styles.attrEarth;
  }
}

function getStarClass(rarity: CardRarity): string {
  switch (rarity) {
    case 'rainbow': return styles.starRainbow;
    case 'gold':    return styles.starGold;
    default:        return styles.starNormal;
  }
}

function getHoloOverlay(rarity: CardRarity): string | null {
  switch (rarity) {
    case 'rainbow': return styles.holoRainbow;
    case 'gold':    return styles.holoGold;
    default:        return null;
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

export function KeibaDigitalCard({
  charaId,
  serialNumber,
  size = 'full',
  cardRef,
  onClick,
}: KeibaDigitalCardProps) {
  const def = KEIBA_CARD_MAP.get(charaId);
  if (!def) return null;

  const illustUrl = getCardIllustUrl(def.illustFile);
  const holoClass = getHoloOverlay(def.rarity);
  const hasSparkles = def.rarity === 'rainbow' || def.rarity === 'gold';
  const sparkleCount = def.rarity === 'rainbow' ? 9 : 5;
  const sizeClass = size === 'collection' ? styles.sizeCollection : styles.sizeFull;
  const displayName = def.ruby ? `${def.name}（${def.ruby}）` : def.name;
  const cardIdText = serialNumber ?? `KG24-${def.cardNumber}`;

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${getRarityStyle(def.rarity)} ${sizeClass}`}
      onClick={onClick}
    >
      <div className={styles.cardInner}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <div className={styles.cardName}>{displayName}</div>
          <div className={`${styles.cardAttribute} ${getAttrStyle(def.attribute)}`}>
            {def.attributeEmoji}
          </div>
        </div>

        {/* Stars */}
        <div className={styles.cardStars}>
          {Array.from({ length: def.stars }).map((_, i) => (
            <span key={i} className={`${styles.star} ${getStarClass(def.rarity)}`}>★</span>
          ))}
        </div>

        {/* Illustration */}
        <div className={styles.cardIllust}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={illustUrl} alt={def.name} crossOrigin="anonymous" />
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
        <div className={styles.cardType}>{def.typeLine}</div>

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
    </div>
  );
}
