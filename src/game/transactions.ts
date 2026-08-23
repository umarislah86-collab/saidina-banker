import type { GameState, CoreGameState, Player, PropertyState, Transaction, TransactionType } from '../types';
import { getProperty } from '../data/properties';

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function makeTransaction(
  type: TransactionType,
  description: string,
  extras: Partial<Transaction> = {}
): Transaction {
  return { id: makeId(), timestamp: Date.now(), type, description, ...extras };
}

function snapshot(state: GameState): CoreGameState {
  const { snapshot: _snap, ...rest } = state;
  return JSON.parse(JSON.stringify(rest));
}

function updatePlayer(state: GameState, playerId: string, changes: Partial<Player>): Player[] {
  return state.players.map(p => p.id === playerId ? { ...p, ...changes } : p);
}

function updateProperty(state: GameState, propertyId: string, changes: Partial<PropertyState>): PropertyState[] {
  return state.properties.map(p => p.propertyId === propertyId ? { ...p, ...changes } : p);
}

function now(): number {
  return Date.now();
}

// ─── MONEY TRANSFER ──────────────────────────────────────────────────────────

export function transferMoney(
  state: GameState,
  fromId: string | 'bank',
  toId: string | 'bank',
  amount: number,
  customDescription?: string
): GameState {
  const snap = snapshot(state);
  let players = [...state.players];

  if (fromId !== 'bank') {
    players = players.map(p => p.id === fromId ? { ...p, cash: p.cash - amount } : p);
  }
  if (toId !== 'bank') {
    players = players.map(p => p.id === toId ? { ...p, cash: p.cash + amount } : p);
  }

  const fromName = fromId === 'bank' ? 'Bank' : state.players.find(p => p.id === fromId)?.name ?? fromId;
  const toName = toId === 'bank' ? 'Bank' : state.players.find(p => p.id === toId)?.name ?? toId;
  const desc = customDescription ?? `${fromName} bayar ${toName} RM${amount.toLocaleString()}`;

  const txExtras: Partial<Transaction> = { amount };
  if (fromId !== 'bank') txExtras.fromPlayerId = fromId;
  if (toId !== 'bank') txExtras.toPlayerId = toId;
  const tx = makeTransaction('money_transfer', desc, txExtras);

  return { ...state, players, transactions: [tx, ...state.transactions], snapshot: snap, updatedAt: now() };
}

// ─── BUY PROPERTY ────────────────────────────────────────────────────────────

export function buyProperty(
  state: GameState,
  playerId: string,
  propertyId: string
): GameState {
  const snap = snapshot(state);
  const def = getProperty(propertyId);
  const player = state.players.find(p => p.id === playerId)!;

  const players = updatePlayer(state, playerId, { cash: player.cash - def.basePrice });
  const properties = updateProperty(state, propertyId, { ownerId: playerId });

  const tx = makeTransaction('buy_property',
    `${player.name} beli ${def.name} RM${def.basePrice.toLocaleString()}`,
    { fromPlayerId: playerId, propertyId, amount: def.basePrice }
  );

  return { ...state, players, properties, transactions: [tx, ...state.transactions], snapshot: snap, updatedAt: now() };
}

// ─── TRANSFER PROPERTY ───────────────────────────────────────────────────────

export function transferProperty(
  state: GameState,
  fromPlayerId: string,
  toPlayerId: string,
  propertyId: string
): GameState {
  const snap = snapshot(state);
  const def = getProperty(propertyId);
  const fromPlayer = state.players.find(p => p.id === fromPlayerId)!;
  const toPlayer = state.players.find(p => p.id === toPlayerId)!;

  const properties = updateProperty(state, propertyId, { ownerId: toPlayerId });
  const tx = makeTransaction('transfer_property',
    `${def.name} dipindah dari ${fromPlayer.name} → ${toPlayer.name}`,
    { fromPlayerId, toPlayerId, propertyId }
  );

  return { ...state, properties, transactions: [tx, ...state.transactions], snapshot: snap, updatedAt: now() };
}

// ─── PAY RENT ────────────────────────────────────────────────────────────────

export function payRent(
  state: GameState,
  tenantId: string,
  propertyId: string,
  rentAmount: number
): GameState {
  const def = getProperty(propertyId);
  const propState = state.properties.find(p => p.propertyId === propertyId)!;
  const ownerId = propState.ownerId!;
  const tenant = state.players.find(p => p.id === tenantId)!;
  const owner = state.players.find(p => p.id === ownerId)!;

  const desc = `${tenant.name} bayar sewa RM${rentAmount.toLocaleString()} kepada ${owner.name} untuk ${def.name}`;
  return transferMoney(state, tenantId, ownerId, rentAmount, desc);
}

// ─── MORTGAGE ────────────────────────────────────────────────────────────────

export function mortgageProperty(
  state: GameState,
  playerId: string,
  propertyId: string
): GameState {
  const snap = snapshot(state);
  const def = getProperty(propertyId);
  const player = state.players.find(p => p.id === playerId)!;

  const players = updatePlayer(state, playerId, { cash: player.cash + def.mortgageValue });
  const properties = updateProperty(state, propertyId, { mortgaged: true });

  const tx = makeTransaction('mortgage',
    `${player.name} gadai ${def.name} — terima RM${def.mortgageValue.toLocaleString()}`,
    { fromPlayerId: playerId, propertyId, amount: def.mortgageValue }
  );

  return { ...state, players, properties, transactions: [tx, ...state.transactions], snapshot: snap, updatedAt: now() };
}

// ─── UNMORTGAGE ──────────────────────────────────────────────────────────────

export function unmortgageProperty(
  state: GameState,
  playerId: string,
  propertyId: string
): GameState {
  const snap = snapshot(state);
  const def = getProperty(propertyId);
  const player = state.players.find(p => p.id === playerId)!;
  const totalCost = def.mortgageValue + def.mortgageInterest;

  const players = updatePlayer(state, playerId, { cash: player.cash - totalCost });
  const properties = updateProperty(state, propertyId, { mortgaged: false });

  const tx = makeTransaction('unmortgage',
    `${player.name} tebus gadai ${def.name} — bayar RM${totalCost.toLocaleString()} (gadai RM${def.mortgageValue.toLocaleString()} + faedah RM${def.mortgageInterest.toLocaleString()})`,
    { fromPlayerId: playerId, propertyId, amount: totalCost }
  );

  return { ...state, players, properties, transactions: [tx, ...state.transactions], snapshot: snap, updatedAt: now() };
}

// ─── BUILD HOUSE ─────────────────────────────────────────────────────────────

export function buildHouse(
  state: GameState,
  playerId: string,
  propertyId: string
): GameState {
  const snap = snapshot(state);
  const def = getProperty(propertyId);
  const player = state.players.find(p => p.id === playerId)!;
  const propState = state.properties.find(p => p.propertyId === propertyId)!;

  const players = updatePlayer(state, playerId, { cash: player.cash - def.houseBuildCost });
  const properties = updateProperty(state, propertyId, { houses: propState.houses + 1 });

  const tx = makeTransaction('build_house',
    `${player.name} bina rumah di ${def.name} — bayar RM${def.houseBuildCost.toLocaleString()}`,
    { fromPlayerId: playerId, propertyId, amount: def.houseBuildCost }
  );

  return { ...state, players, properties, transactions: [tx, ...state.transactions], snapshot: snap, updatedAt: now() };
}

// ─── SELL HOUSE ──────────────────────────────────────────────────────────────

export function sellHouse(
  state: GameState,
  playerId: string,
  propertyId: string
): GameState {
  const snap = snapshot(state);
  const def = getProperty(propertyId);
  const player = state.players.find(p => p.id === playerId)!;
  const propState = state.properties.find(p => p.propertyId === propertyId)!;
  const sellValue = Math.floor(def.houseBuildCost / 2);

  const players = updatePlayer(state, playerId, { cash: player.cash + sellValue });
  const properties = updateProperty(state, propertyId, { houses: propState.houses - 1 });

  const tx = makeTransaction('sell_house',
    `${player.name} jual rumah di ${def.name} — terima RM${sellValue.toLocaleString()}`,
    { toPlayerId: playerId, propertyId, amount: sellValue }
  );

  return { ...state, players, properties, transactions: [tx, ...state.transactions], snapshot: snap, updatedAt: now() };
}

// ─── BUILD HOTEL ─────────────────────────────────────────────────────────────

export function buildHotel(
  state: GameState,
  playerId: string,
  propertyId: string
): GameState {
  const snap = snapshot(state);
  const def = getProperty(propertyId);
  const player = state.players.find(p => p.id === playerId)!;

  const players = updatePlayer(state, playerId, { cash: player.cash - def.hotelBuildCost });
  // Exchange 4 houses for hotel
  const properties = updateProperty(state, propertyId, { houses: 0, hotel: true });

  const tx = makeTransaction('build_hotel',
    `${player.name} bina hotel di ${def.name} — bayar RM${def.hotelBuildCost.toLocaleString()} + serah 4 rumah`,
    { fromPlayerId: playerId, propertyId, amount: def.hotelBuildCost }
  );

  return { ...state, players, properties, transactions: [tx, ...state.transactions], snapshot: snap, updatedAt: now() };
}

// ─── SELL HOTEL ──────────────────────────────────────────────────────────────

export function sellHotel(
  state: GameState,
  playerId: string,
  propertyId: string
): GameState {
  const snap = snapshot(state);
  const def = getProperty(propertyId);
  const player = state.players.find(p => p.id === playerId)!;
  const sellValue = Math.floor(def.hotelBuildCost / 2);

  const players = updatePlayer(state, playerId, { cash: player.cash + sellValue });
  const properties = updateProperty(state, propertyId, { hotel: false, houses: 0 });

  const tx = makeTransaction('sell_hotel',
    `${player.name} jual hotel di ${def.name} — terima RM${sellValue.toLocaleString()}`,
    { toPlayerId: playerId, propertyId, amount: sellValue }
  );

  return { ...state, players, properties, transactions: [tx, ...state.transactions], snapshot: snap, updatedAt: now() };
}

// ─── BANKRUPTCY ──────────────────────────────────────────────────────────────

export function declareBankruptcyToPlayer(
  state: GameState,
  bankruptPlayerId: string,
  creditorId: string
): GameState {
  const snap = snapshot(state);
  const bankrupt = state.players.find(p => p.id === bankruptPlayerId)!;
  const creditor = state.players.find(p => p.id === creditorId)!;

  // Transfer all cash to creditor
  let players = state.players.map(p => {
    if (p.id === bankruptPlayerId) return { ...p, cash: 0, isBankrupt: true };
    if (p.id === creditorId) return { ...p, cash: p.cash + bankrupt.cash };
    return p;
  });

  // Transfer all properties to creditor (including mortgaged)
  const properties = state.properties.map(p =>
    p.ownerId === bankruptPlayerId ? { ...p, ownerId: creditorId } : p
  );

  const tx = makeTransaction('bankruptcy_to_player',
    `${bankrupt.name} MUFLIS — semua aset dipindah ke ${creditor.name}`,
    { fromPlayerId: bankruptPlayerId, toPlayerId: creditorId }
  );

  return { ...state, players, properties, transactions: [tx, ...state.transactions], snapshot: snap, updatedAt: now() };
}

export function declareBankruptcyToBank(
  state: GameState,
  bankruptPlayerId: string
): GameState {
  const snap = snapshot(state);
  const bankrupt = state.players.find(p => p.id === bankruptPlayerId)!;

  const players = state.players.map(p =>
    p.id === bankruptPlayerId ? { ...p, cash: 0, isBankrupt: true } : p
  );

  // Return all properties to bank
  const properties = state.properties.map(p =>
    p.ownerId === bankruptPlayerId
      ? { propertyId: p.propertyId, ownerId: null, mortgaged: false, houses: 0, hotel: false }
      : p
  );

  const tx = makeTransaction('bankruptcy_to_bank',
    `${bankrupt.name} MUFLIS — semua aset dikembalikan ke Bank`,
    { fromPlayerId: bankruptPlayerId }
  );

  return { ...state, players, properties, transactions: [tx, ...state.transactions], snapshot: snap, updatedAt: now() };
}

// ─── NEXT TURN ───────────────────────────────────────────────────────────────

export function nextTurn(state: GameState): GameState {
  const activePlayers = state.players.filter(p => !p.isBankrupt);
  if (activePlayers.length === 0) return state;

  let nextIndex = (state.currentTurnIndex + 1) % state.players.length;
  let safety = 0;
  while (state.players[nextIndex]?.isBankrupt && safety < state.players.length) {
    nextIndex = (nextIndex + 1) % state.players.length;
    safety++;
  }

  return { ...state, currentTurnIndex: nextIndex, turnNumber: state.turnNumber + 1, updatedAt: now() };
}

export function previousTurn(state: GameState): GameState {
  let prevIndex = (state.currentTurnIndex - 1 + state.players.length) % state.players.length;
  let safety = 0;
  while (state.players[prevIndex]?.isBankrupt && safety < state.players.length) {
    prevIndex = (prevIndex - 1 + state.players.length) % state.players.length;
    safety++;
  }
  const turnNumber = Math.max(1, state.turnNumber - 1);
  return { ...state, currentTurnIndex: prevIndex, turnNumber, updatedAt: now() };
}

// ─── UNDO ────────────────────────────────────────────────────────────────────

export function undoLastTransaction(state: GameState): GameState | null {
  if (!state.snapshot) return null;
  return { ...state.snapshot, snapshot: null, updatedAt: now() };
}

// ─── COLLECT START ───────────────────────────────────────────────────────────

export function collectStart(state: GameState, playerId: string, amount: number): GameState {
  const player = state.players.find(p => p.id === playerId)!;
  const desc = `${player.name} lalu Mula — terima RM${amount.toLocaleString()}`;
  return transferMoney(state, 'bank', playerId, amount, desc);
}
