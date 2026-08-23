import type { Unsubscribe } from 'firebase/firestore';
import { doc, setDoc, deleteDoc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import type { GameState, CoreGameState, GameResult } from '../types';

const COLLECTION = 'games';
const RESULTS_COLLECTION = 'results';

function toSyncState(state: GameState): CoreGameState {
  const { snapshot: _snap, ...rest } = state;
  return JSON.parse(JSON.stringify(rest));
}

export function syncGameToFirestore(state: GameState): void {
  try {
    const syncState = toSyncState(state);
    setDoc(doc(db, COLLECTION, state.gameId), syncState).catch(() => {});
  } catch {
    // Non-fatal
  }
}

export function deleteGame(gameId: string): void {
  deleteDoc(doc(db, COLLECTION, gameId)).catch(() => {});
}

export function saveGameResult(result: GameResult): Promise<void> {
  const clean = JSON.parse(JSON.stringify(result));
  return setDoc(doc(db, RESULTS_COLLECTION, result.gameId), clean);
}

export function subscribeToGame(
  gameId: string,
  onUpdate: (state: CoreGameState) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, COLLECTION, gameId),
    snapshot => { if (snapshot.exists()) onUpdate(snapshot.data() as CoreGameState); },
    err => onError?.(err)
  );
}

export function deleteGameResult(gameId: string): Promise<void> {
  return deleteDoc(doc(db, RESULTS_COLLECTION, gameId));
}

export function subscribeToResults(
  onUpdate: (results: GameResult[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(db, RESULTS_COLLECTION), orderBy('finishedAt', 'desc'), limit(10)),
    snapshot => onUpdate(snapshot.docs.map(d => d.data() as GameResult)),
    err => onError?.(err)
  );
}
