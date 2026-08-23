import { useState } from 'react';
import type { GameState, GameResult, GameResultRanking } from '../../../types';
import { calculateNetWorth } from '../../../game/netWorth';
import { saveGameResult, deleteGame } from '../../../services/sync';

interface Props {
  state: GameState;
  onFinish: () => void;
  onClose: () => void;
}

interface RankEntry {
  playerId: string;
  name: string;
  avatar?: string;
  netWorth: number;
  isBankrupt: boolean;
  bankruptAt?: number;
}

function buildAutoRanking(state: GameState): RankEntry[] {
  const active = state.players
    .filter(p => !p.isBankrupt)
    .map(p => ({ playerId: p.id, name: p.name, avatar: p.avatar, netWorth: calculateNetWorth(p.id, state), isBankrupt: false, bankruptAt: undefined }))
    .sort((a, b) => b.netWorth - a.netWorth);

  const bankrupt = state.players
    .filter(p => p.isBankrupt)
    .sort((a, b) => (b.bankruptAt ?? 0) - (a.bankruptAt ?? 0))
    .map(p => ({ playerId: p.id, name: p.name, avatar: p.avatar, netWorth: calculateNetWorth(p.id, state), isBankrupt: true, bankruptAt: p.bankruptAt }));

  return [...active, ...bankrupt];
}

export default function FinishModal({ state, onFinish, onClose }: Props) {
  const [ranking, setRanking] = useState<RankEntry[]>(() => buildAutoRanking(state));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function moveUp(idx: number) {
    if (idx === 0) return;
    setRanking(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moveDown(idx: number) {
    if (idx === ranking.length - 1) return;
    setRanking(prev => {
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  async function handleConfirm() {
    setSaving(true);
    setError('');
    const rankings: GameResultRanking[] = ranking.map((e, i) => ({
      rank: i + 1,
      name: e.name,
      avatar: e.avatar,
      netWorth: e.netWorth,
      isBankrupt: e.isBankrupt,
    }));
    const result: GameResult = {
      gameId: state.gameId,
      finishedAt: Date.now(),
      duration: state.createdAt ? Date.now() - state.createdAt : 0,
      rankings,
    };
    try {
      await saveGameResult(result);
      deleteGame(state.gameId);
      onFinish();
    } catch {
      setError('Gagal simpan. Cuba lagi.');
      setSaving(false);
    }
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 bg-black/80 p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black text-lg">Tamat Permainan 🏆</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center text-xl">✕</button>
        </div>

        <p className="text-gray-400 text-sm">Susun ranking akhir atau guna susunan automatik.</p>

        <button
          onClick={() => setRanking(buildAutoRanking(state))}
          className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-amber-400 text-sm font-semibold rounded-xl"
        >
          ↺ Auto Ranking (ikut NW)
        </button>

        <div className="space-y-2">
          {ranking.map((entry, idx) => (
            <div
              key={entry.playerId}
              className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                entry.isBankrupt ? 'border-gray-800 bg-gray-800/50 opacity-60' : 'border-gray-700 bg-gray-800'
              }`}
            >
              <span className="text-xl w-7 text-center">{medals[idx] ?? `#${idx + 1}`}</span>
              {entry.avatar ? (
                <img src={entry.avatar} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt="" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-black text-gray-400 flex-shrink-0">
                  {entry.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{entry.name}</p>
                <p className="text-gray-500 text-xs">RM{entry.netWorth.toLocaleString()}{entry.isBankrupt ? ' · Muflis' : ''}</p>
              </div>
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="text-gray-500 hover:text-white disabled:opacity-20 text-xs px-1 py-0.5"
                >▲</button>
                <button
                  onClick={() => moveDown(idx)}
                  disabled={idx === ranking.length - 1}
                  className="text-gray-500 hover:text-white disabled:opacity-20 text-xs px-1 py-0.5"
                >▼</button>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleConfirm}
          disabled={saving}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-black rounded-xl"
        >
          {saving ? 'Menyimpan...' : 'Sahkan & Simpan 🏆'}
        </button>
      </div>
    </div>
  );
}
