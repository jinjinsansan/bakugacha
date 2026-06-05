import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'scripts/**',
      'supabase/**',
      'public/**',

      // ── お蔵入りガチャ（2026-06 時点で本番非公開・休眠コード）────────
      // 本番では cd2（カウントダウン）のみ稼働。下記は将来復活用に残すが
      // 保守対象外のため lint からは除外する。復活時はこの ignore を外すこと。
      // ※ StarOverlay は cd2 と共有のため除外しない（lint 対象に残す）。
      'src/components/gacha/EcardGachaPlayer.tsx',
      'src/components/gacha/ElevatorGachaPlayer.tsx',
      'src/components/gacha/KeibaGachaPlayer.tsx',
      'src/components/gacha/RaiseGachaPlayer.tsx',
      'src/components/gacha/keiba/**',
      'src/components/gacha/raise/**',
      'src/components/gacha/overlays/FloorNumberOverlay.tsx',
      'src/components/gacha/overlays/LightningOverlay.tsx',
      'src/components/gacha/overlays/MultidoorOverlay.tsx',
      'src/app/api/ecard-gacha/**',
      'src/app/api/elevator-gacha/**',
      'src/app/api/keiba-gacha/**',
      'src/app/api/raise-gacha/**',
      'src/lib/ecard-gacha/**',
      'src/lib/elevator-gacha/**',
      'src/lib/keiba-gacha/**',
      'src/lib/raise-gacha/**',
      'src/lib/data/ecard-gacha.ts',
      'src/lib/data/elevator-gacha.ts',
      'src/lib/data/keiba-gacha.ts',
      'src/lib/data/raise-gacha.ts',
      'src/lib/data/keiba-cards.ts',
      'src/lib/data/raise-cards.ts',
    ],
  },
  {
    rules: {
      // 「render 中の ref 更新」は最新値をコールバックで参照するための既知の安全な
      // パターンで、本番 cd2 演出でも使用。再設計はリグレッションリスクが高いため warn。
      'react-hooks/refs': 'warn',
      // effect 内 setState はアニメ初期化で使用。本番演出を壊さないため warn に留める。
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];

export default eslintConfig;
