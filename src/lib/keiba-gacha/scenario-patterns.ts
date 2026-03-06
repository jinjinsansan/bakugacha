import type { KeibaStep, KeibaScenario } from './types';
import {
  CHARA_MAP,
  COURSE_MAP,
  UMAOYAJI_COURSE,
  TITLE_BY_COURSE,
} from './scenarios';

// ── どんでんタイプ ─────────────────────────────────────────────

export type DontenType = 'up' | 'down' | 'comedy';

export type DontenTiming = 'G' | 'H';

// ── どんでんパターン定義 ───────────────────────────────────────

export interface DontenPattern {
  id: string;
  fanfareCourse: string;
  introCharaId: string;
  dontenTiming: DontenTiming;
  /** 差替先コース（null = コース差替なし、同コース内でキャラだけ変わる） */
  switchCourse: string | null;
  isWin: boolean;
  /** 勝利キャラ（ハズレの場合は null） */
  resultCharaId: string | null;
  forcedStar: number;
  type: DontenType;
}

export const DONTEN_PATTERNS: DontenPattern[] = [
  // ── コース 01: 晴れ×芝 ────────────────────────────
  { id: 'S10', fanfareCourse: '01', introCharaId: 'fuwarin',        dontenTiming: 'G', switchCourse: '01b', isWin: true,  resultCharaId: 'umaoyaji',       forcedStar: 6, type: 'up' },
  { id: 'S11', fanfareCourse: '01', introCharaId: 'fuwarin',        dontenTiming: 'H', switchCourse: null,   isWin: true,  resultCharaId: 'bakugachahime',  forcedStar: 1, type: 'up' },
  { id: 'S12', fanfareCourse: '01', introCharaId: 'bakugachahime',  dontenTiming: 'G', switchCourse: null,   isWin: false, resultCharaId: null,             forcedStar: 4, type: 'down' },
  { id: 'S13', fanfareCourse: '01', introCharaId: 'shirogane',      dontenTiming: 'H', switchCourse: null,   isWin: true,  resultCharaId: 'darkbolt',       forcedStar: 3, type: 'up' },

  // ── コース 02: 晴れ×ダート ────────────────────────
  { id: 'S18', fanfareCourse: '02', introCharaId: 'fuwarin',        dontenTiming: 'H', switchCourse: null,   isWin: true,  resultCharaId: 'darkbolt',       forcedStar: 2, type: 'up' },
  { id: 'S19', fanfareCourse: '02', introCharaId: 'bakugachahime',  dontenTiming: 'G', switchCourse: null,   isWin: false, resultCharaId: null,             forcedStar: 4, type: 'down' },

  // ── コース 03: 稍重×芝 ──────────────────────────
  { id: 'S23', fanfareCourse: '03', introCharaId: 'fuwarin',        dontenTiming: 'H', switchCourse: '01b', isWin: true,  resultCharaId: 'umaoyaji',       forcedStar: 3, type: 'up' },
  { id: 'S24', fanfareCourse: '03', introCharaId: 'fuwarin',        dontenTiming: 'G', switchCourse: null,   isWin: true,  resultCharaId: 'aoikaze',        forcedStar: 1, type: 'up' },

  // ── コース 04: 稍重×ダート ────────────────────────
  { id: 'S28', fanfareCourse: '04', introCharaId: 'fuwarin',        dontenTiming: 'H', switchCourse: null,   isWin: true,  resultCharaId: 'darkbolt',       forcedStar: 1, type: 'up' },

  // ── コース 05: 重馬場×芝 ─────────────────────────
  { id: 'S31', fanfareCourse: '05', introCharaId: 'bakugachahime',  dontenTiming: 'G', switchCourse: null,   isWin: false, resultCharaId: null,             forcedStar: 6, type: 'down' },
  { id: 'S32', fanfareCourse: '05', introCharaId: 'fuwarin',        dontenTiming: 'H', switchCourse: '01b', isWin: true,  resultCharaId: 'umaoyaji',       forcedStar: 1, type: 'up' },
  { id: 'S33', fanfareCourse: '05', introCharaId: 'aoikaze',        dontenTiming: 'G', switchCourse: null,   isWin: true,  resultCharaId: 'aoikaze',        forcedStar: 2, type: 'up' },
  { id: 'S34', fanfareCourse: '05', introCharaId: 'fuwarin',        dontenTiming: 'G', switchCourse: '01',  isWin: true,  resultCharaId: 'shirogane',      forcedStar: 1, type: 'up' },

  // ── コース 06: 大雨×芝 ──────────────────────────
  { id: 'S39', fanfareCourse: '06', introCharaId: 'fuwarin',        dontenTiming: 'G', switchCourse: null,   isWin: true,  resultCharaId: 'fuwarin',        forcedStar: 6, type: 'comedy' },
  { id: 'S40', fanfareCourse: '06', introCharaId: 'bakugachahime',  dontenTiming: 'H', switchCourse: null,   isWin: false, resultCharaId: null,             forcedStar: 5, type: 'down' },
  { id: 'S41', fanfareCourse: '06', introCharaId: 'shirogane',      dontenTiming: 'G', switchCourse: null,   isWin: true,  resultCharaId: 'bakugachahime',  forcedStar: 4, type: 'up' },
  { id: 'S42', fanfareCourse: '06', introCharaId: 'fuwarin',        dontenTiming: 'H', switchCourse: '05',  isWin: false, resultCharaId: null,             forcedStar: 3, type: 'comedy' },

  // ── コース 07: 大雨×ダート ────────────────────────
  { id: 'S47', fanfareCourse: '07', introCharaId: 'shirogane',      dontenTiming: 'G', switchCourse: null,   isWin: true,  resultCharaId: 'darkbolt',       forcedStar: 6, type: 'up' },
  { id: 'S48', fanfareCourse: '07', introCharaId: 'bakugachahime',  dontenTiming: 'H', switchCourse: null,   isWin: false, resultCharaId: null,             forcedStar: 6, type: 'down' },
  { id: 'S49', fanfareCourse: '07', introCharaId: 'fuwarin',        dontenTiming: 'G', switchCourse: '05',  isWin: false, resultCharaId: null,             forcedStar: 3, type: 'down' },
  { id: 'S50', fanfareCourse: '07', introCharaId: 'fuwarin',        dontenTiming: 'H', switchCourse: '01b', isWin: true,  resultCharaId: 'umaoyaji',       forcedStar: 1, type: 'up' },
];

// ── パターン選択 ───────────────────────────────────────────────

/**
 * ファンファーレコース + イントロキャラ + どんでんタイプ でマッチするパターンを選択。
 * マッチなしの場合は null（呼び元が通常フローにフォールバック）。
 */
export function selectDontenPattern(
  fanfareCourse: string,
  introCharaId: string,
  dontenType: DontenType,
): DontenPattern | null {
  const candidates = DONTEN_PATTERNS.filter(
    (p) =>
      p.fanfareCourse === fanfareCourse &&
      p.introCharaId === introCharaId &&
      p.type === dontenType,
  );
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * どんでんタイプに関係なく、ファンファーレコース+イントロキャラでマッチするパターンをランダム選択。
 * forcedWin 時に down/comedy がマッチした場合は上振れフィルタも可能。
 */
export function selectAnyDontenPattern(
  fanfareCourse: string,
  introCharaId: string,
): DontenPattern | null {
  const candidates = DONTEN_PATTERNS.filter(
    (p) =>
      p.fanfareCourse === fanfareCourse &&
      p.introCharaId === introCharaId,
  );
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ── ステップ構築 ───────────────────────────────────────────────

/**
 * どんでんパターンからステップ配列を構築し KeibaScenario を返す。
 */
export function buildDontenScenario(pattern: DontenPattern): KeibaScenario {
  const introChara = CHARA_MAP.get(pattern.introCharaId);
  if (!introChara) throw new Error(`Unknown introCharaId: ${pattern.introCharaId}`);

  const fanfareCourse = COURSE_MAP.get(pattern.fanfareCourse);
  if (!fanfareCourse) throw new Error(`Unknown fanfareCourse: ${pattern.fanfareCourse}`);

  // タイトル動画はファンファーレコースから取得
  const titleFile = TITLE_BY_COURSE[pattern.fanfareCourse] ?? 'title_sunny_turf.mp4';

  // どんでん返し時のレースコース決定
  // switchCourse が '01b' → UMAOYAJI_COURSE
  // switchCourse がコースID → そのコース
  // switchCourse が null → ファンファーレコースをそのまま使う
  const resolveSwitchCourse = () => {
    if (!pattern.switchCourse) return null;
    if (pattern.switchCourse === '01b') return UMAOYAJI_COURSE;
    return COURSE_MAP.get(pattern.switchCourse) ?? null;
  };

  const switchedCourse = resolveSwitchCourse();

  // E, F はファンファーレコース（通常コース）のまま
  // G, H は dontenTiming に応じて差し替え
  const eCourse = fanfareCourse;
  const fCourse = fanfareCourse;
  let gCourse = fanfareCourse;
  let hCourse = fanfareCourse;

  if (pattern.dontenTiming === 'G' && switchedCourse) {
    // G以降をすべて差替コースに
    gCourse = switchedCourse;
    hCourse = switchedCourse;
  } else if (pattern.dontenTiming === 'H' && switchedCourse) {
    // Hのみ差替コースに
    hCourse = switchedCourse;
  }

  // 勝利/敗北動画
  let resultFile: string;
  let resultStepName: string;

  if (pattern.isWin && pattern.resultCharaId) {
    const resultChara = CHARA_MAP.get(pattern.resultCharaId);
    if (!resultChara) throw new Error(`Unknown resultCharaId: ${pattern.resultCharaId}`);
    resultFile = resultChara.winFile;
    resultStepName = 'result_win';
  } else {
    // ハズレ → イントロキャラの LOSE 動画
    resultFile = introChara.loseFile;
    resultStepName = 'result_lose';
  }

  const steps: KeibaStep[] = [
    { name: 'title',        file: titleFile },
    { name: 'chara_intro',  file: introChara.introFile },
    { name: 'gate_start',   file: eCourse.gateFile },
    { name: 'pack_run',     file: fCourse.packFile },
    { name: 'final_corner', file: gCourse.cornerFile },
    { name: 'goal_front',   file: hCourse.goalFile },
    { name: resultStepName, file: resultFile },
  ];

  return {
    isWin: pattern.isWin,
    charaId: pattern.introCharaId,
    courseId: pattern.fanfareCourse,
    resultCharaId: pattern.isWin && pattern.resultCharaId
      ? pattern.resultCharaId
      : pattern.introCharaId,
    steps,
  };
}

// ── どんでんタイプ抽選 ─────────────────────────────────────────

export function rollDontenType(
  upRate: number,
  downRate: number,
  comedyRate: number,
): DontenType {
  const total = upRate + downRate + comedyRate;
  const roll = Math.random() * total;
  if (roll < upRate) return 'up';
  if (roll < upRate + downRate) return 'down';
  return 'comedy';
}
