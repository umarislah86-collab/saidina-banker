import type { GameState, GameConfig, Player, PropertyState, SetupPlayerDraft } from '../types';
import { PROPERTIES } from '../data/properties';
import { DEFAULT_CONFIG } from '../data/gameConfig';

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createInitialGameState(
  players: SetupPlayerDraft[],
  config: Partial<GameConfig> = {}
): GameState {
  const mergedConfig: GameConfig = { ...DEFAULT_CONFIG, ...config };

  const gamePlayers: Player[] = players.map((p, i) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    cash: mergedConfig.startingCash,
    isBankrupt: false,
    turnOrder: i,
    ...(p.avatar ? { avatar: p.avatar } : {}),
  }));

  const properties: PropertyState[] = PROPERTIES.map(def => ({
    propertyId: def.id,
    ownerId: null,
    mortgaged: false,
    houses: 0,
    hotel: false,
  }));

  return {
    gameId: makeId(),
    status: 'playing',
    config: mergedConfig,
    players: gamePlayers,
    properties,
    currentTurnIndex: 0,
    turnNumber: 1,
    transactions: [],
    snapshot: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function getCurrentPlayer(state: GameState): Player | undefined {
  return state.players[state.currentTurnIndex];
}

export function getActivePlayerCount(state: GameState): number {
  return state.players.filter(p => !p.isBankrupt).length;
}
