'use client';

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeibaDigitalCard } from './KeibaDigitalCard';
import { downloadCardAsPng } from '@/lib/keiba-gacha/card-download';
import { KEIBA_CARD_MAP } from '@/lib/keiba-gacha/cards';

interface KeibaCardRevealProps {
  charaId: string;
  serialNumber: string;
  onClose: () => void;
}

export function KeibaCardReveal({ charaId, serialNumber, onClose }: KeibaCardRevealProps) {
  const [phase, setPhase] = useState<'back' | 'flip' | 'done'>('back');
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const def = KEIBA_CARD_MAP.get(charaId);

  // Phase transitions with auto-advance
  const handleBackAnimComplete = useCallback(() => {
    setTimeout(() => setPhase('flip'), 600);
  }, []);

  const handleFlipComplete = useCallback(() => {
    setPhase('done');
  }, []);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      await downloadCardAsPng(cardRef.current, serialNumber);
    } catch (e) {
      console.error('[card-download]', e);
    } finally {
      setDownloading(false);
    }
  }, [serialNumber, downloading]);

  if (!def) return null;

  const rarityColor = def.rarity === 'rainbow' ? '#c850ff'
    : def.rarity === 'gold' ? '#ffd700'
    : def.rarity === 'silver' ? '#a0b0c0'
    : '#b08040';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: 'rgba(0,0,0,0.92)' }}
      >
        {/* Card back → flip → front */}
        <div className="relative" style={{ perspective: 1200 }}>
          {phase === 'back' && (
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              onAnimationComplete={handleBackAnimComplete}
              style={{
                width: 295,
                height: 430,
                borderRadius: 14,
                background: `linear-gradient(135deg, #1a1a2e 0%, ${rarityColor}33 50%, #1a1a2e 100%)`,
                border: `2px solid ${rarityColor}66`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 60px ${rarityColor}40`,
              }}
            >
              <div style={{
                fontSize: 64,
                color: rarityColor,
                textShadow: `0 0 20px ${rarityColor}`,
              }}>
                🃏
              </div>
            </motion.div>
          )}

          {phase === 'flip' && (
            <motion.div
              initial={{ rotateY: 180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              onAnimationComplete={handleFlipComplete}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <KeibaDigitalCard charaId={charaId} serialNumber={serialNumber} size="full" cardRef={cardRef} />
            </motion.div>
          )}

          {phase === 'done' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <KeibaDigitalCard charaId={charaId} serialNumber={serialNumber} size="full" cardRef={cardRef} />
            </motion.div>
          )}
        </div>

        {/* Burst effect on flip completion */}
        {phase === 'done' && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            style={{
              background: `radial-gradient(circle, ${rarityColor}30 0%, transparent 70%)`,
            }}
          />
        )}

        {/* Serial number */}
        {phase === 'done' && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-xs font-bold tracking-widest"
            style={{ color: rarityColor }}
          >
            {serialNumber}
          </motion.p>
        )}

        {/* Action buttons */}
        {phase === 'done' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex items-center gap-3"
          >
            <button
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${rarityColor}, ${rarityColor}cc)`,
                color: def.rarity === 'gold' || def.rarity === 'rainbow' ? '#1a1a2e' : '#fff',
                boxShadow: `0 4px 20px ${rarityColor}40`,
              }}
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? '保存中...' : 'PNGダウンロード'}
            </button>
            <button
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white/70 hover:text-white transition"
              style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)' }}
              onClick={onClose}
            >
              閉じる
            </button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
