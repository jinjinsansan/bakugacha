'use client';

import { useEffect, useRef } from 'react';

/** イナズマパーティクルオーバーレイ（勝ちパターン演出） */
export function LightningOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let animId = 0;
    let w = 0;
    let h = 0;

    const resize = () => {
      w = canvas.clientWidth * devicePixelRatio;
      h = canvas.clientHeight * devicePixelRatio;
      canvas.width = w;
      canvas.height = h;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── パーティクル ──
    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      life: number; maxLife: number;
      size: number;
      hue: number;
    };
    const particles: Particle[] = [];

    function spawnParticle() {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.3,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 6 + 2,
        life: 1,
        maxLife: 0.4 + Math.random() * 0.6,
        size: 1 + Math.random() * 3,
        hue: 190 + Math.random() * 60, // 青〜シアン
      });
    }

    // ── イナズマ (bolt) ──
    type Bolt = { segments: { x1: number; y1: number; x2: number; y2: number }[]; life: number; alpha: number };
    const bolts: Bolt[] = [];

    function spawnBolt() {
      const segments: Bolt['segments'] = [];
      let x = Math.random() * w;
      let y = 0;
      const targetY = h * (0.5 + Math.random() * 0.5);
      while (y < targetY) {
        const nx = x + (Math.random() - 0.5) * 80;
        const ny = y + 15 + Math.random() * 30;
        segments.push({ x1: x, y1: y, x2: nx, y2: ny });
        x = nx;
        y = ny;
      }
      bolts.push({ segments, life: 1, alpha: 0.7 + Math.random() * 0.3 });
    }

    let elapsed = 0;
    let lastTime = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      elapsed += dt;

      ctx.clearRect(0, 0, w, h);

      // パーティクルを毎フレーム追加
      for (let i = 0; i < 3; i++) spawnParticle();

      // ランダムにイナズマ発生
      if (Math.random() < 0.08) spawnBolt();

      // ── ボルト描画 ──
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i];
        b.life -= dt * 3;
        if (b.life <= 0) { bolts.splice(i, 1); continue; }
        const a = b.life * b.alpha;
        // グロー
        ctx.save();
        ctx.strokeStyle = `rgba(180,220,255,${a * 0.4})`;
        ctx.lineWidth = 6;
        ctx.shadowColor = 'rgba(100,180,255,0.8)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        for (const s of b.segments) { ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); }
        ctx.stroke();
        // コア
        ctx.strokeStyle = `rgba(220,240,255,${a})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (const s of b.segments) { ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); }
        ctx.stroke();
        ctx.restore();
      }

      // ── パーティクル描画 ──
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt / p.maxLife;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        p.x += p.vx;
        p.y += p.vy;
        const a = p.life;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.shadowColor = `hsla(${p.hue},90%,70%,0.9)`;
        ctx.shadowBlur = 8;
        ctx.fillStyle = `hsla(${p.hue},80%,80%,${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 全体フラッシュ（ボルト発生時）
      if (bolts.length > 0) {
        const flash = Math.min(bolts.reduce((s, b) => s + b.life * b.alpha, 0), 1);
        ctx.fillStyle = `rgba(200,230,255,${flash * 0.08})`;
        ctx.fillRect(0, 0, w, h);
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
