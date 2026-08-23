import { useReducer, useEffect, useCallback } from 'react';
import type { GameState, GameConfig, SetupPlayerDraft } from '../types';
import { createInitialGameState } from '../game/gameState';
import * as TX from '../game/transactions';
import { saveGame, loadGame, clearGame } from '../game/persistence';
import { syncGameToFirestore } from '../services/sync';

type Action =
  | { type: 'LOAD'; state: GameState }
  | { type: 'NEW_GAME'; players: SetupPlayerDraft[]; config: Partial<GameConfig> }
  | { type: 'TRANSFER'; fromId: string | 'bank'; toId: string | 'bank'; amount: number; desc?: string }
  | { type: 'BUY_PROPERTY'; playerId: string; propertyId: string }
  | { type: 'TRANSFER_PROPERTY'; fromId: string; toId: string; propertyId: string }
  | { type: 'PAY_RENT'; tenantId: string; propertyId: string; amount: number }
  | { type: 'MORTGAGE'; playerId: string; propertyId: string }
  | { type: 'UNMORTGAGE'; playerId: string; propertyId: string }
  | { type: 'BUILD_HOUSE'; playerId: string; propertyId: string }
  | { type: 'BUILD_HOUSES_MULTI'; playerId: string; propertyId: string; count: number }
  | { type: 'SELL_HOUSE'; playerId: string; propertyId: string }
  | { type: 'BUILD_HOTEL'; playerId: string; propertyId: string }
  | { type: 'SELL_HOTEL'; playerId: string; propertyId: string }
  | { type: 'BANKRUPT_TO_PLAYER'; bankruptId: string; creditorId: string }
  | { type: 'BANKRUPT_TO_BANK'; bankruptId: string }
  | { type: 'NEXT_TURN' }
  | { type: 'PREV_TURN' }
  | { type: 'UNDO' }
  | { type: 'RESET' }
  | { type: 'COLLECT_START'; playerId: string; amount: number }
  | { type: 'SET_AVATAR'; playerId: string; avatar: string };

function reducer(state: GameState | null, action: Action): GameState | null {
  if (action.type === 'LOAD') return action.state;
  if (action.type === 'RESET') return null;
  if (action.type === 'NEW_GAME') return createInitialGameState(action.players, action.config);
  if (!state) return state;

  switch (action.type) {
    case 'TRANSFER':
      return TX.transferMoney(state, action.fromId, action.toId, action.amount, action.desc);
    case 'BUY_PROPERTY':
      return TX.buyProperty(state, action.playerId, action.propertyId);
    case 'TRANSFER_PROPERTY':
      return TX.transferProperty(state, action.fromId, action.toId, action.propertyId);
    case 'PAY_RENT':
      return TX.payRent(state, action.tenantId, action.propertyId, action.amount);
    case 'MORTGAGE':
      return TX.mortgageProperty(state, action.playerId, action.propertyId);
    case 'UNMORTGAGE':
      return TX.unmortgageProperty(state, action.playerId, action.propertyId);
    case 'BUILD_HOUSE':
      return TX.buildHouse(state, action.playerId, action.propertyId);
    case 'BUILD_HOUSES_MULTI': {
      let s = state;
      for (let i = 0; i < action.count; i++) s = TX.buildHouse(s, action.playerId, action.propertyId);
      return s;
    }
    case 'SELL_HOUSE':
      return TX.sellHouse(state, action.playerId, action.propertyId);
    case 'BUILD_HOTEL':
      return TX.buildHotel(state, action.playerId, action.propertyId);
    case 'SELL_HOTEL':
      return TX.sellHotel(state, action.playerId, action.propertyId);
    case 'BANKRUPT_TO_PLAYER': {
      const result = TX.declareBankruptcyToPlayer(state, action.bankruptId, action.creditorId);
      return { ...result, players: result.players.map(p =>
        p.id === action.bankruptId ? { ...p, bankruptAt: p.bankruptAt ?? Date.now() } : p
      )};
    }
    case 'BANKRUPT_TO_BANK': {
      const result = TX.declareBankruptcyToBank(state, action.bankruptId);
      return { ...result, players: result.players.map(p =>
        p.id === action.bankruptId ? { ...p, bankruptAt: p.bankruptAt ?? Date.now() } : p
      )};
    }
    case 'NEXT_TURN':
      return TX.nextTurn(state);
    case 'PREV_TURN':
      return TX.previousTurn(state);
    case 'UNDO': {
      const undone = TX.undoLastTransaction(state);
      return undone ?? state;
    }
    case 'COLLECT_START':
      return TX.collectStart(state, action.playerId, action.amount);
    case 'SET_AVATAR':
      return { ...state, players: state.players.map(p => p.id === action.playerId ? { ...p, avatar: action.avatar } : p) };
    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, null, () => loadGame());

  useEffect(() => {
    if (state) {
      saveGame(state);
      syncGameToFirestore(state);
    } else {
      clearGame();
    }
  }, [state]);

  const startGame = useCallback((players: SetupPlayerDraft[], config: Partial<GameConfig>) => {
    dispatch({ type: 'NEW_GAME', players, config });
  }, []);

  const resetGame = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { state, dispatch, startGame, resetGame };
}
