import type { GameState } from '../types';
import { getProperty, getPropertiesByGroup } from '../data/properties';

const INDUSTRY_IDS = ['automobil', 'bioteknologi', 'farmaseutikal', 'telekomunikasi'];
const UTILITY_IDS  = ['bekalan_air', 'bekalan_elektrik'];

export function calculateRent(propertyId: string, state: GameState): number {
  const propState = state.properties.find(p => p.propertyId === propertyId);
  if (!propState?.ownerId || propState.mortgaged) return 0;

  const def = getProperty(propertyId);
  const rent = def.rent;

  if (rent.type === 'standard') {
    if (propState.hotel) return rent.hotel;
    if (propState.houses > 0) {
      return [rent.house1, rent.house2, rent.house3, rent.house4][propState.houses - 1];
    }
    const groupDefs = getPropertiesByGroup(def.colorGroup);
    const ownedCount = state.properties.filter(
      p => groupDefs.some(g => g.id === p.propertyId) && p.ownerId === propState.ownerId
    ).length;
    const tiers = [rent.land1, rent.land2, rent.land3].filter((v): v is number => v !== undefined);
    return tiers[Math.min(ownedCount, tiers.length) - 1];
  }

  if (rent.type === 'industry') {
    const ownedCount = state.properties.filter(
      p => INDUSTRY_IDS.includes(p.propertyId) && p.ownerId === propState.ownerId
    ).length;
    return [rent.owned1, rent.owned2, rent.owned3, rent.owned4][Math.min(ownedCount, 4) - 1];
  }

  if (rent.type === 'utility') {
    const ownedCount = state.properties.filter(
      p => UTILITY_IDS.includes(p.propertyId) && p.ownerId === propState.ownerId
    ).length;
    return ownedCount >= 2 ? rent.owned2 : rent.owned1;
  }

  return 0;
}
