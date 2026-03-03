export type EcardStep =
  | 'standby' | 'title'
  | 'my_blackout' | 'opp_blackout'
  | 'my_card_back' | 'opp_card_back'
  | 'my_emperor' | 'my_slave' | 'my_citizen'
  | 'opp_emperor' | 'opp_slave' | 'opp_citizen'
  | 'my_emperor_win' | 'my_slave_win' | 'my_citizen_win'
  | 'opp_emperor_lose' | 'opp_slave_lose' | 'opp_citizen_lose'
  | 'win' | 'lose' | 'draw'
  | 'donten'
  | 'final_win' | 'final_lose';

export type EcardAxis = 'A' | 'B' | 'C' | 'D' | 'E';

export type EcardCard = 'emperor' | 'slave' | 'citizen';

export interface EcardScenario {
  axis: EcardAxis;
  scenarioCode: string;
  isWin: boolean;
  isDonten: boolean;
  totalRounds: number;
  queue: EcardStep[];
}

export interface EcardSettings {
  id: string;
  winRate: number;
  axisARate: number;
  axisBRate: number;
  axisCRate: number;
  axisDRate: number;
  axisERate: number;
  dontenRate: number;
  star5Rate: number;
  star4Rate: number;
  isActive: boolean;
}
