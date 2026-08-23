export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'pink' | 'cyan';

export type ColorGroup =
  | 'orange' | 'brown' | 'pink' | 'purple'
  | 'lightBlue' | 'blue' | 'green' | 'darkGreen'
  | 'utility' | 'industry';

export type PropertyType = 'standard' | 'utility' | 'industry';

export type DiceMode = 'physical' | 'digital';

export interface StandardRent {
  type: 'standard';
  land1: number;
  land2: number;
  land3?: number;
  house1: number;
  house2: number;
  house3: number;
  house4: number;
  hotel: number;
}

export interface UtilityRent {
  type: 'utility';
  owned1: number;
  owned2: number;
}

export interface IndustryRent {
  type: 'industry';
  owned1: number;
  owned2: number;
  owned3: number;
  owned4: number;
}

export type RentSchedule = StandardRent | UtilityRent | IndustryRent;

export interface PropertyDef {
  id: string;
  deedNumber: number;
  name: string;
  streetName: string;
  colorGroup: ColorGroup;
  propertyType: PropertyType;
  basePrice: number;
  mortgageValue: number;
  mortgageInterest: number;
  houseBuildCost: number;
  hotelBuildCost: number;
  rent: RentSchedule;
  needsVerification?: boolean;
}

export interface PropertyState {
  propertyId: string;
  ownerId: string | null;
  mortgaged: boolean;
  houses: number;
  hotel: boolean;
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  cash: number;
  isBankrupt: boolean;
  turnOrder: number;
  avatar?: string;
  bankruptAt?: number;
}

export type TransactionType =
  | 'money_transfer'
  | 'bank_to_player'
  | 'player_to_bank'
  | 'pay_rent'
  | 'buy_property'
  | 'transfer_property'
  | 'mortgage'
  | 'unmortgage'
  | 'build_house'
  | 'sell_house'
  | 'build_hotel'
  | 'sell_hotel'
  | 'bankruptcy_to_player'
  | 'bankruptcy_to_bank'
  | 'pay_tax'
  | 'collect_start';

export interface Transaction {
  id: string;
  timestamp: number;
  type: TransactionType;
  fromPlayerId?: string;
  toPlayerId?: string;
  amount?: number;
  propertyId?: string;
  description: string;
}

export interface GameConfig {
  startingCash: number;
  diceMode: DiceMode;
}

export interface GameState {
  gameId: string;
  status: 'setup' | 'playing' | 'finished';
  config: GameConfig;
  players: Player[];
  properties: PropertyState[];
  currentTurnIndex: number;
  turnNumber: number;
  transactions: Transaction[];
  snapshot: CoreGameState | null;
  createdAt: number;
  updatedAt: number;
}

export type CoreGameState = Omit<GameState, 'snapshot'>;

export interface SetupPlayerDraft {
  id: string;
  name: string;
  color: PlayerColor;
  avatar?: string;
}

export interface GameResultRanking {
  rank: number;
  name: string;
  avatar?: string;
  netWorth: number;
  isBankrupt: boolean;
}

export interface GameResult {
  gameId: string;
  finishedAt: number;
  duration: number;
  rankings: GameResultRanking[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const PLAYER_COLOR_MAP: Record<PlayerColor, { bg: string; text: string; border: string; hex: string }> = {
  red:    { bg: 'bg-red-500',    text: 'text-red-400',    border: 'border-red-500',    hex: '#ef4444' },
  blue:   { bg: 'bg-blue-500',   text: 'text-blue-400',   border: 'border-blue-500',   hex: '#3b82f6' },
  green:  { bg: 'bg-green-500',  text: 'text-green-400',  border: 'border-green-500',  hex: '#22c55e' },
  yellow: { bg: 'bg-yellow-400', text: 'text-yellow-400', border: 'border-yellow-400', hex: '#facc15' },
  purple: { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500', hex: '#a855f7' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500', hex: '#f97316' },
  pink:   { bg: 'bg-pink-500',   text: 'text-pink-400',   border: 'border-pink-500',   hex: '#ec4899' },
  cyan:   { bg: 'bg-cyan-400',   text: 'text-cyan-400',   border: 'border-cyan-400',   hex: '#22d3ee' },
};

export const GROUP_COLOR_MAP: Record<ColorGroup, { hex: string; label: string }> = {
  orange:   { hex: '#f97316', label: 'Orange' },
  brown:    { hex: '#92400e', label: 'Brown' },
  pink:     { hex: '#ec4899', label: 'Pink' },
  purple:   { hex: '#8b5cf6', label: 'Purple' },
  lightBlue:{ hex: '#38bdf8', label: 'Light Blue' },
  blue:     { hex: '#3b82f6', label: 'Blue' },
  green:    { hex: '#22c55e', label: 'Green' },
  darkGreen:{ hex: '#15803d', label: 'Dark Green' },
  utility:  { hex: '#94a3b8', label: 'Utility' },
  industry: { hex: '#f59e0b', label: 'Industry' },
};
