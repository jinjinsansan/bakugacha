import type {
  ElevatorRiseType,
  ElevatorStopType,
  ElevatorFloor,
  ElevatorScenario,
  ElevatorSettings,
} from './types';

// ── ランダム選択ヘルパー ─────────────────────────────────────

function pickRiseType(): ElevatorRiseType {
  const r = Math.random();
  if (r < 0.6) return 'rise_normal';
  if (r < 0.85) return 'rise_fast';
  return 'rise_down';
}

/** 全停止バリエーション（演出のみのものを含む） */
const VISUAL_STOP_TYPES: ElevatorStopType[] = [
  'stop_vibration', 'stop_emergency', 'stop_transparent',
  'stop_halfopen', 'stop_mirror', 'stop_ghost',
  'stop_ice', 'stop_fire',
];

function pickStopType(settings: ElevatorSettings): ElevatorStopType {
  const weights: { type: ElevatorStopType; rate: number }[] = [
    { type: 'stop_normal', rate: 100 },
    { type: 'stop_countdown', rate: settings.countdownFloorRate },
    { type: 'stop_multidoor', rate: settings.multidoorFloorRate },
    { type: 'stop_numchaos', rate: settings.chaosFloorRate },
    { type: 'stop_numreverse', rate: settings.reverseFloorRate },
    // 演出バリエーション（各10の固定ウェイト）
    ...VISUAL_STOP_TYPES.map((type) => ({ type, rate: 10 })),
  ];
  const total = weights.reduce((a, b) => a + b.rate, 0);
  let r = Math.random() * total;
  for (const w of weights) {
    r -= w.rate;
    if (r <= 0) return w.type;
  }
  return 'stop_normal';
}

// ── シナリオ生成 ─────────────────────────────────────────────

export function generateScenario(
  settings: ElevatorSettings,
  isWin: boolean,
  isDonten: boolean,
): ElevatorScenario {
  const { minFloors, maxFloors, floorRangeMin, floorRangeMax } = settings;
  const floorCount = minFloors + Math.floor(Math.random() * (maxFloors - minFloors + 1));

  const floors: ElevatorFloor[] = [];

  for (let i = 0; i < floorCount; i++) {
    const isFinal = i === floorCount - 1;
    // 仕様書通り: floor_range_min〜floor_range_max でランダム生成
    const floorNumber = floorRangeMin + Math.floor(Math.random() * (floorRangeMax - floorRangeMin + 1));

    // 上昇タイプ
    const riseType = pickRiseType();

    // 停止タイプ
    let stopType: ElevatorStopType;
    if (isFinal) {
      // 最終フロア: ボスまたは通常（ボスは強制OPEN）
      stopType = Math.random() * 100 < settings.bossFloorRate ? 'stop_boss' : 'stop_normal';
    } else {
      stopType = pickStopType(settings);
    }

    // OPEN結果
    let openResult: ElevatorFloor['openResult'];
    if (isFinal) {
      if (isDonten) {
        // どんでん返し: 壁崩壊→コイン噴出（当たり）
        openResult = 'wall_collapse';
      } else if (isWin) {
        if (stopType === 'stop_boss') {
          openResult = 'coin_boss';
        } else {
          openResult = Math.random() < 0.3 ? 'coin_explosion' : 'coin';
        }
      } else {
        openResult = 'hole';
      }
    } else {
      // 非最終フロアは常に壁
      openResult = 'wall';
    }

    floors.push({ floorNumber, riseType, stopType, openResult, isFinal });
  }

  const actualWin = isDonten ? true : isWin;

  return {
    isWin: actualWin,
    isDonten,
    floors,
    scenarioCode: `ELV-${floorCount}F-${actualWin ? 'W' : 'L'}${isDonten ? '-D' : ''}`,
  };
}
