import type { KeibaStep, KeibaScenario, KeibaSettings } from './types';

// ── キャラ定義 ──────────────────────────────────────────────

type Rarity = 'R' | 'SR' | 'SSR' | 'SSR_STAR' | 'SSR_PREMIUM';

interface CharaDef {
  id: string;
  name: string;
  rarity: Rarity;
  defaultWeight: number;
  introFile: string;
  winFile: string;
  loseFile: string;
}

const CHARACTERS: CharaDef[] = [
  { id: 'shirogane',      name: 'シロガネ',         rarity: 'SR',          defaultWeight: 7,  introFile: 'A-01_chara_shirogane.mp4',      winFile: 'WIN-01_shirogane.mp4',      loseFile: 'LOSE-01_shirogane.mp4' },
  { id: 'darkbolt',       name: 'ダークボルト',     rarity: 'SR',          defaultWeight: 7,  introFile: 'A-02_chara_darkbolt.mp4',       winFile: 'WIN-02_darkbolt.mp4',       loseFile: 'LOSE-02_darkbolt.mp4' },
  { id: 'aoikaze',        name: 'アオイカゼ',       rarity: 'SSR',         defaultWeight: 5,  introFile: 'A-03_chara_aoikaze.mp4',        winFile: 'WIN-03_aoikaze.mp4',        loseFile: 'LOSE-03_aoikaze.mp4' },
  { id: 'honohime',       name: 'ホノオヒメ',       rarity: 'SR',          defaultWeight: 7,  introFile: 'A-04_chara_honohime.mp4',       winFile: 'WIN-04_honohime.mp4',       loseFile: 'LOSE-04_honohime.mp4' },
  { id: 'fuwarin',        name: 'フワリン',         rarity: 'R',           defaultWeight: 25, introFile: 'A-05_chara_fuwarin.mp4',        winFile: 'WIN-05_fuwarin.mp4',        loseFile: 'LOSE-05_fuwarin.mp4' },
  { id: 'bakugachahime',  name: 'バクガチャヒメ',   rarity: 'SSR_STAR',    defaultWeight: 4,  introFile: 'A-06_chara_bakugachahime.mp4',  winFile: 'WIN-06_bakugachahime.mp4',  loseFile: 'LOSE-06_bakugachahime.mp4' },
  { id: 'umaoyaji',       name: '馬親父',           rarity: 'SSR_PREMIUM', defaultWeight: 3,  introFile: 'A-07_chara_umaoyaji.mp4',       winFile: 'WIN-07_umaoyaji.mp4',       loseFile: 'LOSE-07_umaoyaji.mp4' },
];

const CHARA_MAP = new Map(CHARACTERS.map((c) => [c.id, c]));

export function getCharaName(charaId: string): string {
  return CHARA_MAP.get(charaId)?.name ?? charaId;
}

// ── コース定義 ──────────────────────────────────────────────

interface CourseDef {
  id: string;
  label: string;
  defaultAppearanceWeight: number;
  defaultWinRate: number;
  gateFile: string;
  packFile: string;
  cornerFile: string;
  goalFile: string;
}

const COURSES: CourseDef[] = [
  { id: '01', label: '晴れ×芝',       defaultAppearanceWeight: 30, defaultWinRate: 60, gateFile: 'E-01_gate_sunny_turf.mp4',       packFile: 'F-01_pack_side_sunny_turf.mp4',       cornerFile: 'G-01_final_corner_sunny_turf.mp4',       goalFile: 'H-01_goal_front_sunny_turf.mp4' },
  { id: '02', label: '晴れ×ダート',   defaultAppearanceWeight: 20, defaultWinRate: 45, gateFile: 'E-02_gate_sunny_dirt.mp4',        packFile: 'F-02_pack_side_sunny_dirt.mp4',        cornerFile: 'G-02_final_corner_sunny_dirt.mp4',        goalFile: 'H-02_goal_front_sunny_dirt.mp4' },
  { id: '03', label: '稍重×芝',       defaultAppearanceWeight: 15, defaultWinRate: 35, gateFile: 'E-03_gate_start_soft_turf.mp4',   packFile: 'F-03_pack_side_soft_turf.mp4',        cornerFile: 'G-03_final_corner_soft_turf.mp4',        goalFile: 'H-03_goal_front_soft_turf.mp4' },
  { id: '04', label: '稍重×ダート',   defaultAppearanceWeight: 15, defaultWinRate: 25, gateFile: 'E-04_gate_start_soft_dirt.mp4',   packFile: 'F-04_pack_side_soft_dirt.mp4',        cornerFile: 'G-04_final_corner_soft_dirt.mp4',        goalFile: 'H-04_goal_front_soft_dirt.mp4' },
  { id: '05', label: '重馬場×芝',     defaultAppearanceWeight: 10, defaultWinRate: 15, gateFile: 'E-05_gate_start_heavy_turf.mp4',  packFile: 'F-05_pack_side_heavy_turf.mp4',       cornerFile: 'G-05_final_corner_heavy_turf.mp4',       goalFile: 'H-05_goal_front_heavy_turf.mp4' },
  { id: '06', label: '大雨×芝',       defaultAppearanceWeight: 5,  defaultWinRate: 70, gateFile: 'E-06_gate_start_rain_turf.mp4',   packFile: 'F-06_pack_side_rain_turf.mp4',        cornerFile: 'G-06_final_corner_rain_turf.mp4',        goalFile: 'H-06_goal_front_rain_turf.mp4' },
  { id: '07', label: '大雨×ダート',   defaultAppearanceWeight: 5,  defaultWinRate: 75, gateFile: 'E-07_gate_start_rain_dirt.mp4',   packFile: 'F-07_pack_side_rain_dirt.mp4',        cornerFile: 'G-07_final_corner_rain_dirt.mp4',        goalFile: 'H-07_goal_front_rain_dirt.mp4' },
];

const COURSE_MAP = new Map(COURSES.map((c) => [c.id, c]));

/** 馬親父専用コース（晴れ×芝 固定） */
const UMAOYAJI_COURSE: CourseDef = {
  id: '01',
  label: '晴れ×芝（馬親父）',
  defaultAppearanceWeight: 0,
  defaultWinRate: 60,
  gateFile:   'E-01b_gate_start_sunny_turf_umaoyaji.mp4',
  packFile:   'F-01b_pack_side_sunny_turf_umaoyaji.mp4',
  cornerFile: 'G-01b_final_corner_sunny_turf_umaoyaji.mp4',
  goalFile:   'H-01b_goal_front_sunny_turf_umaoyaji.mp4',
};

// ── タイトル動画マッピング ──────────────────────────────────

const TITLE_BY_RARITY: Record<Rarity, string> = {
  R:           'D-05a_title_normal.mp4',
  SR:          'D-05b_title_heatup.mp4',
  SSR:         'D-05c_title_hot.mp4',
  SSR_STAR:    'D-05d_title_ssr.mp4',
  SSR_PREMIUM: 'D-05d_title_ssr.mp4',
};

// ── デフォルト キャラ×コース補正 ────────────────────────────

const DEFAULT_CHARA_COURSE_BONUSES: Record<string, Record<string, number>> = {
  aoikaze:       { '01': 20, '07': -10 },
  darkbolt:      { '02': 20, '04': 20, '01': -10 },
  shirogane:     { '01': 10, '03': 10 },
  fuwarin:       { '*': -20 },
  bakugachahime: { '06': 10, '07': 10 },
};

// ── ユーティリティ ──────────────────────────────────────────

function weightedPick<T extends { id: string }>(
  items: T[],
  getWeight: (item: T) => number,
): T {
  const totalWeight = items.reduce((sum, item) => sum + getWeight(item), 0);
  let roll = Math.random() * totalWeight;
  for (const item of items) {
    roll -= getWeight(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

// ── 公開関数 ────────────────────────────────────────────────

export function pickCharacter(settings: KeibaSettings): CharaDef {
  return weightedPick(CHARACTERS, (c) => {
    const override = settings.charaRates[c.id];
    return override != null ? override : c.defaultWeight;
  });
}

export function pickCourse(charaId: string, settings: KeibaSettings): CourseDef {
  if (charaId === 'umaoyaji') return UMAOYAJI_COURSE;
  return weightedPick(COURSES, (c) => {
    const override = settings.courseAppearanceRates[c.id];
    return override != null ? override : c.defaultAppearanceWeight;
  });
}

export function pickTitle(charaRarity: Rarity): string {
  return TITLE_BY_RARITY[charaRarity];
}

/**
 * コース別当たり率 + キャラ×コース補正 + キャラ別上書きを適用した実効当たり率を算出。
 * - 馬親父: umaoyajiWinRate で上書き（コース率無視）
 * - バクガチャヒメ: コース率+補正 の下限を bakugachahimeWinRate で保証
 * - フワリン: コース率+補正 の上限を fuwarinWinRate で制限
 * - 他キャラ: コース率+補正 をそのまま適用
 * - 最終値を 5%〜100% にクランプ
 */
export function getEffectiveWinRate(
  charaId: string,
  courseId: string,
  settings: KeibaSettings,
): number {
  // 馬親父は常に固定レートで上書き
  if (charaId === 'umaoyaji') {
    return Math.min(100, Math.max(5, settings.umaoyajiWinRate));
  }

  // 1. コース別ベース当たり率を取得
  const courseOverride = settings.courseWinRates[courseId];
  const courseDef = COURSE_MAP.get(courseId);
  let rate = courseOverride ?? courseDef?.defaultWinRate ?? 30;

  // 2. キャラ×コース補正を適用
  const bonuses = settings.charaCourseBonuses[charaId] ?? DEFAULT_CHARA_COURSE_BONUSES[charaId];
  if (bonuses) {
    // ワイルドカード補正（全コース共通、フワリン用）
    if (bonuses['*'] != null) {
      rate += bonuses['*'];
    }
    // コース個別補正
    if (bonuses[courseId] != null) {
      rate += bonuses[courseId];
    }
  }

  // 3. キャラ別の下限/上限を適用
  if (charaId === 'bakugachahime') {
    rate = Math.max(rate, settings.bakugachahimeWinRate);
  } else if (charaId === 'fuwarin') {
    rate = Math.min(rate, settings.fuwarinWinRate);
  }

  // 4. 5%〜100% にクランプ
  return Math.min(100, Math.max(5, rate));
}

export function generateScenario(
  isWin: boolean,
  charaId: string,
  courseId: string,
): KeibaScenario {
  const chara = CHARA_MAP.get(charaId);
  if (!chara) throw new Error(`Unknown charaId: ${charaId}`);

  const course = charaId === 'umaoyaji'
    ? UMAOYAJI_COURSE
    : COURSES.find((c) => c.id === courseId) ?? COURSES[0];

  const titleFile = pickTitle(chara.rarity);

  const steps: KeibaStep[] = [
    { name: 'title',        file: titleFile },
    { name: 'chara_intro',  file: chara.introFile },
    { name: 'gate_start',   file: course.gateFile },
    { name: 'pack_run',     file: course.packFile },
    { name: 'final_corner', file: course.cornerFile },
    { name: 'goal_front',   file: course.goalFile },
    { name: isWin ? 'result_win' : 'result_lose',
      file: isWin ? chara.winFile : chara.loseFile },
  ];

  return { isWin, charaId, courseId: course.id, steps };
}
