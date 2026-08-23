import type { GameState, ValidationResult } from '../types';
import { getProperty } from '../data/properties';

export function validateTransfer(
  fromId: string | 'bank',
  toId: string | 'bank',
  amount: number,
  state: GameState
): ValidationResult {
  if (amount <= 0) return { valid: false, error: 'Jumlah mesti lebih dari RM0' };
  if (fromId === toId) return { valid: false, error: 'Tak boleh transfer kepada diri sendiri' };

  if (fromId !== 'bank') {
    const from = state.players.find(p => p.id === fromId);
    if (!from) return { valid: false, error: 'Pemain tidak dijumpai' };
    if (from.isBankrupt) return { valid: false, error: `${from.name} dah muflis` };
    if (from.cash < amount) return { valid: false, error: `${from.name} tak cukup wang (ada RM${from.cash.toLocaleString()})` };
  }

  if (toId !== 'bank') {
    const to = state.players.find(p => p.id === toId);
    if (!to) return { valid: false, error: 'Penerima tidak dijumpai' };
    if (to.isBankrupt) return { valid: false, error: `${to.name} dah muflis` };
  }

  return { valid: true };
}

export function validateBuyProperty(
  playerId: string,
  propertyId: string,
  state: GameState
): ValidationResult {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return { valid: false, error: 'Pemain tidak dijumpai' };
  if (player.isBankrupt) return { valid: false, error: `${player.name} dah muflis` };

  const propState = state.properties.find(p => p.propertyId === propertyId);
  if (!propState) return { valid: false, error: 'Hartanah tidak dijumpai' };
  if (propState.ownerId) return { valid: false, error: 'Hartanah ini dah ada pemilik' };

  const def = getProperty(propertyId);
  if (player.cash < def.basePrice) {
    return { valid: false, error: `Tak cukup wang (harga RM${def.basePrice.toLocaleString()}, ada RM${player.cash.toLocaleString()})` };
  }

  return { valid: true };
}

export function validateMortgage(
  playerId: string,
  propertyId: string,
  state: GameState
): ValidationResult {
  const propState = state.properties.find(p => p.propertyId === propertyId);
  if (!propState) return { valid: false, error: 'Hartanah tidak dijumpai' };
  if (propState.ownerId !== playerId) return { valid: false, error: 'Bukan milik pemain ini' };
  if (propState.mortgaged) return { valid: false, error: 'Hartanah ini dah digadai' };
  if (propState.houses > 0 || propState.hotel) {
    return { valid: false, error: 'Kena jual rumah/hotel dulu sebelum gadai' };
  }
  return { valid: true };
}

export function validateUnmortgage(
  playerId: string,
  propertyId: string,
  state: GameState
): ValidationResult {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return { valid: false, error: 'Pemain tidak dijumpai' };

  const propState = state.properties.find(p => p.propertyId === propertyId);
  if (!propState) return { valid: false, error: 'Hartanah tidak dijumpai' };
  if (propState.ownerId !== playerId) return { valid: false, error: 'Bukan milik pemain ini' };
  if (!propState.mortgaged) return { valid: false, error: 'Hartanah ini tak digadai' };

  const def = getProperty(propertyId);
  const totalCost = def.mortgageValue + def.mortgageInterest;
  if (player.cash < totalCost) {
    return { valid: false, error: `Tak cukup wang (kos RM${totalCost.toLocaleString()}, ada RM${player.cash.toLocaleString()})` };
  }
  return { valid: true };
}

export function validateBuildHouse(
  playerId: string,
  propertyId: string,
  state: GameState
): ValidationResult {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return { valid: false, error: 'Pemain tidak dijumpai' };

  const propState = state.properties.find(p => p.propertyId === propertyId);
  if (!propState) return { valid: false, error: 'Hartanah tidak dijumpai' };
  if (propState.ownerId !== playerId) return { valid: false, error: 'Bukan milik pemain ini' };
  if (propState.mortgaged) return { valid: false, error: 'Hartanah ini digadai' };
  if (propState.hotel) return { valid: false, error: 'Dah ada hotel' };
  if (propState.houses >= 4) return { valid: false, error: 'Dah penuh 4 rumah — bina hotel' };

  const def = getProperty(propertyId);
  if (def.propertyType !== 'standard') return { valid: false, error: 'Jenis hartanah ini tak boleh bina rumah' };

  if (player.cash < def.houseBuildCost) {
    return { valid: false, error: `Tak cukup wang (kos RM${def.houseBuildCost.toLocaleString()})` };
  }
  return { valid: true };
}

export function validateBuildHotel(
  playerId: string,
  propertyId: string,
  state: GameState
): ValidationResult {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return { valid: false, error: 'Pemain tidak dijumpai' };

  const propState = state.properties.find(p => p.propertyId === propertyId);
  if (!propState) return { valid: false, error: 'Hartanah tidak dijumpai' };
  if (propState.ownerId !== playerId) return { valid: false, error: 'Bukan milik pemain ini' };
  if (propState.mortgaged) return { valid: false, error: 'Hartanah ini digadai' };
  if (propState.hotel) return { valid: false, error: 'Dah ada hotel' };
  if (propState.houses < 4) return { valid: false, error: 'Kena ada 4 rumah dulu sebelum bina hotel' };

  const def = getProperty(propertyId);
  if (player.cash < def.hotelBuildCost) {
    return { valid: false, error: `Tak cukup wang (kos RM${def.hotelBuildCost.toLocaleString()})` };
  }
  return { valid: true };
}
