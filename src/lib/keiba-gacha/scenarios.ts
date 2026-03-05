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

// ── コース定義 ──────────────────────────────────────────────

interface CourseDef {
  id: string;
  label: string;
  defaultWeight: number;
  gateFile: string;
  packFile: string;
  cornerFile: string;
  goalFile: string;
}

const COURSES: CourseDef[] = [
  { id: '01', label: '晴れ×芝',       defaultWeight: 25, gateFile: 'E-01_gate_sunny_turf.mp4',       packFile: 'F-01_pack_side_sunny_turf.mp4',       cornerFile: 'G-01_final_corner_sunny_turf.mp4',       goalFile: 'H-01_goal_front_sunny_turf.mp4' },
  { id: '02', label: '晴れ×ダート',   defaultWeight: 20, gateFile: 'E-02_gate_sunny_dirt.mp4',        packFile: 'F-02_pack_side_sunny_dirt.mp4',        cornerFile: 'G-02_final_corner_sunny_dirt.mp4',        goalFile: 'H-02_goal_front_sunny_dirt.mp4' },
  { id: '03', label: '稍重×芝',       defaultWeight: 15, gateFile: 'E-03_gate_start_soft_turf.mp4',   packFile: 'F-03_pack_side_soft_turf.mp4',        cornerFile: 'G-03_final_corner_soft_turf.mp4',        goalFile: 'H-03_goal_front_soft_turf.mp4' },
  { id: '04', label: '稍重×ダート',   defaultWeight: 15, gateFile: 'E-04_gate_start_soft_dirt.mp4',   packFile: 'F-04_pack_side_soft_dirt.mp4',        cornerFile: 'G-04_final_corner_soft_dirt.mp4',        goalFile: 'H-04_goal_front_soft_dirt.mp4' },
  { id: '05', label: '重馬場×芝',     defaultWeight: 10, gateFile: 'E-05_gate_start_heavy_turf.mp4',  packFile: 'F-05_pack_side_heavy_turf.mp4',       cornerFile: 'G-05_final_corner_heavy_turf.mp4',       goalFile: 'H-05_goal_front_heavy_turf.mp4' },
  { id: '06', label: '大雨×芝',       defaultWeight: 10, gateFile: 'E-06_gate_start_rain_turf.mp4',   packFile: 'F-06_pack_side_rain_turf.mp4',        cornerFile: 'G-06_final_corner_rain_turf.mp4',        goalFile: 'H-06_goal_front_rain_turf.mp4' },
  { id: '07', label: '大雨×ダート',   defaultWeight: 5,  gateFile: 'E-07_gate_start_rain_dirt.mp4',   packFile: 'F-07_pack_side_rain_dirt.mp4',        cornerFile: 'G-07_final_corner_rain_dirt.mp4',        goalFile: 'H-07_goal_front_rain_dirt.mp4' },
];

/** 馬親父専用コース（晴れ×芝 固定） */
const UMAOYAJI_COURSE: CourseDef = {
  id: '01',
  label: '晴れ×芝（馬親父）',
  defaultWeight: 0,
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
    const override = settings.courseRates[c.id];
    return override != null ? override : c.defaultWeight;
  });
}

export function pickTitle(charaRarity: Rarity): string {
  return TITLE_BY_RARITY[charaRarity];
}

export function getCharaWinRate(charaId: string, settings: KeibaSettings): number {
  switch (charaId) {
    case 'umaoyaji':      return settings.umaoyajiWinRate;
    case 'bakugachahime':  return settings.bakugachahimeWinRate;
    case 'fuwarin':        return settings.fuwarinWinRate;
    default:               return 100; // shirogane, darkbolt, aoikaze, honohime = 確定
  }
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
