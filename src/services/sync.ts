import type { Unsubscribe } from 'firebase/firestore';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { GameState, CoreGameState } from '../types';

const COLLECTION = 'games';

function toSyncState(state: GameState): CoreGameState {
  const { snapshot: _snap, ...rest } = state;
  // Strip undefined values — Firestore rejects them
  return JSON.parse(JSON.stringify(rest));
}

export function syncGameToFirestore(state: GameState): void {
  try {
    const syncState = toSyncState(state);
    setDoc(doc(db, COLLECTION, state.gameId), syncState).catch(() => {
      // Non-fatal — local state is source of truth
    });
  } catch {
    // Non-fatal
  }
}

export function subscribeToGame(
  gameId: string,
  onUpdate: (state: CoreGameState) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, COLLECTION, gameId),
    snapshot => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as CoreGameState);
      }
    },
    err => onError?.(err)
  );
}
