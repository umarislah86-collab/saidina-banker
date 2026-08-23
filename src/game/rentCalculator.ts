import type { GameState } from '../types';
import { getProperty } from '../data/properties';

export function calculateRent(
  propertyId: string,
  state: GameState
): number {
  const propState = state.properties.find(p => p.propertyId === propertyId);
  if (!propState || !propState.ownerId || propState.mortgaged) return 0;

  const def = getProperty(propertyId);
  const ownerProps = state.properties.filter(
    p => p.ownerId === propState.ownerId && !p.mortgaged
  );

  if (def.propertyType === 'utility') {
    const r = def.rent as { type: 'utility'; owned1: number; owned2: number };
    const utilityCount = ownerProps.filter(p => {
      const d = getProperty(p.propertyId);
      return d.propertyType === 'utility';
    }).length;
    return utilityCount >= 2 ? r.owned2 : r.owned1;
  }

  if (def.propertyType === 'industry') {
    const r = def.rent as { type: 'industry'; owned1: number; owned2: number; owned3: number; owned4: number };
    const indCount = ownerProps.filter(p => {
      const d = getProperty(p.propertyId);
      return d.propertyType === 'industry';
    }).length;
    if (indCount >= 4) return r.owned4;
    if (indCount === 3) return r.owned3;
    if (indCount === 2) return r.owned2;
    return r.owned1;
  }

  // Standard property
  const r = def.rent as {
    type: 'standard';
    land1: number; land2: number; land3?: number;
    house1: number; house2: number; house3: number; house4: number; hotel: number;
  };

  if (propState.hotel) return r.hotel;
  if (propState.houses === 4) return r.house4;
  if (propState.houses === 3) return r.house3;
  if (propState.houses === 2) return r.house2;
  if (propState.houses === 1) return r.house1;

  // No buildings — use land tier (count owned in same color group)
  const groupCount = ownerProps.filter(p => {
    const d = getProperty(p.propertyId);
    return d.colorGroup === def.colorGroup;
  }).length;

  if (groupCount >= 3 && r.land3 !== undefined) return r.land3;
  if (groupCount >= 2) return r.land2;
  return r.land1;
}

export function getRentDescription(propertyId: string, state: GameState): string {
  const propState = state.properties.find(p => p.propertyId === propertyId);
  if (!propState) return '';
  if (propState.mortgaged) return 'Digadai — Sewa RM0';

  const def = getProperty(propertyId);
  if (propState.hotel) return 'Hotel';
  if (propState.houses > 0) return `${propState.houses} Rumah`;

  if (def.propertyType === 'utility' || def.propertyType === 'industry') {
    const ownerProps = state.properties.filter(p => p.ownerId === propState.ownerId);
    const sameType = ownerProps.filter(p => {
      const d = getProperty(p.propertyId);
      return d.propertyType === def.propertyType;
    }).length;
    return `${sameType} ${def.propertyType === 'utility' ? 'Kemudahan' : 'Industri'}`;
  }

  const ownerProps = state.properties.filter(p => p.ownerId === propState.ownerId && !p.mortgaged);
  const groupCount = ownerProps.filter(p => {
    const d = getProperty(p.propertyId);
    return d.colorGroup === def.colorGroup;
  }).length;
  return `${groupCount} Tanah`;
}
