import type { GameState } from '../types';
import { getProperty } from '../data/properties';

export function calculateNetWorth(playerId: string, state: GameState): number {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return 0;

  let worth = player.cash;

  for (const propState of state.properties) {
    if (propState.ownerId !== playerId) continue;
    const def = getProperty(propState.propertyId);

    // Property value
    worth += propState.mortgaged ? def.mortgageValue : def.basePrice;

    // Development value (at full build cost)
    if (def.propertyType === 'standard') {
      worth += propState.houses * def.houseBuildCost;
      if (propState.hotel) worth += def.hotelBuildCost;
    }
  }

  return worth;
}

export function getPlayerProperties(playerId: string, state: GameState) {
  return state.properties
    .filter(p => p.ownerId === playerId)
    .map(p => ({ state: p, def: getProperty(p.propertyId) }));
}
