// ── エレベーターガチャ 型定義 ──────────────────────────────────

export type ElevatorRiseType = 'rise_normal' | 'rise_fast' | 'rise_down';

export type ElevatorStopType =
  | 'stop_normal'
  | 'stop_boss'
  | 'stop_countdown'
  | 'stop_multidoor'
  | 'stop_numchaos'
  | 'stop_numreverse'
  | 'stop_vibration'
  | 'stop_emergency'
  | 'stop_transparent'
  | 'stop_halfopen'
  | 'stop_mirror'
  | 'stop_ghost'
  | 'stop_ice'
  | 'stop_fire';

export type ElevatorOpenResult =
  | 'wall'
  | 'hole'
  | 'coin'
  | 'coin_boss'
  | 'coin_explosion'
  | 'wall_collapse';

export interface ElevatorFloor {
  floorNumber: number;
  riseType: ElevatorRiseType;
  stopType: ElevatorStopType;
  openResult: ElevatorOpenResult;
  isFinal: boolean;
}

export interface ElevatorScenario {
  isWin: boolean;
  isDonten: boolean;
  floors: ElevatorFloor[];
  scenarioCode: string;
}

export interface ElevatorSettings {
  id: string;
  isActive: boolean;
  winRate: number;
  dontenRate: number;
  minFloors: number;
  maxFloors: number;
  floorRangeMin: number;
  floorRangeMax: number;
  bossFloorRate: number;
  countdownFloorRate: number;
  multidoorFloorRate: number;
  chaosFloorRate: number;
  reverseFloorRate: number;
  star5Rate: number;
  star4Rate: number;
  countdownSeconds: number;
  chainLoseThreshold: number;
}
