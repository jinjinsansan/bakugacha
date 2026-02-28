export type Cd2Step =
  | 'standby'
  | 'title_red'
  | 'red_10' | 'red_9' | 'red_8' | 'red_7' | 'red_6'
  | 'red_5'  | 'red_4' | 'red_3' | 'red_2' | 'red_1' | 'red_0'
  | 'red_3_win'  | 'red_2_win'  | 'red_1_win'  | 'red_0_win'
  | 'red_3_loss' | 'red_2_loss' | 'red_1_loss' | 'red_0_loss'
  | 'red_loss'
  | 'patlite' | 'donden' | 'jackpot' | 'freeze';

export type Cd2Result = 'win' | 'loss';

export interface Cd2PlayScenario {
  isWin: boolean;
  isDonden: boolean;
  isPatlite: boolean;
  isFreeze: boolean;
  sequence: Cd2Step[];
  expectationStars: number;
}

export interface Cd2Settings {
  id: string;
  isEnabled: boolean;
  lossRate: number;
  dondenRate: number;
  patliteRate: number;
  freezeRate: number;
}
