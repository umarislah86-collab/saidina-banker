import { useState } from 'react';
import type { GameState } from '../../../types';
import { validateTransfer } from '../../../game/validation';
import RM from '../../../components/RM';

interface Props {
  state: GameState;
  onTransfer: (fromId: string | 'bank', toId: string | 'bank', amount: number) => void;
  onClose: () => void;
  defaultFromId?: string;
  defaultToId?: string;
}

const BANK_OPTION = '__bank__';

export default function TransferModal({ state, onTransfer, onClose, defaultFromId, defaultToId }: Props) {
  const active = state.players.filter(p => !p.isBankrupt);
  const [fromId, setFromId] = useState<string>(defaultFromId ?? (active[0]?.id ?? BANK_OPTION));
  const [toId, setToId] = useState<string>(defaultToId ?? BANK_OPTION);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const amt = parseInt(amount) || 0;
  const fromPlayer = state.players.find(p => p.id === fromId);
  const toPlayer = state.players.find(p => p.id === toId);

  const fromCash = fromPlayer?.cash ?? null;
  const toCash = toPlayer?.cash ?? null;

  function handleConfirm() {
    const v = validateTransfer(
      fromId === BANK_OPTION ? 'bank' : fromId,
      toId === BANK_OPTION ? 'bank' : toId,
      amt,
      state
    );
    if (!v.valid) { setError(v.error!); return; }
    onTransfer(
      fromId === BANK_OPTION ? 'bank' : fromId,
      toId === BANK_OPTION ? 'bank' : toId,
      amt
    );
    onClose();
  }

  const presetAmounts = [500, 1000, 1500, 2000, 2500, 5000];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Pindah Wang</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {/* FROM */}
        <div className="space-y-1">
          <label className="text-gray-400 text-xs uppercase tracking-wider">Dari</label>
          <select
            value={fromId}
            onChange={e => { setFromId(e.target.value); setError(''); }}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
          >
            <option value={BANK_OPTION}>Bank</option>
            {state.players.filter(p => !p.isBankrupt).map(p => (
              <option key={p.id} value={p.id}>{p.name} (RM{p.cash.toLocaleString()})</option>
            ))}
          </select>
        </div>

        {/* TO */}
        <div className="space-y-1">
          <label className="text-gray-400 text-xs uppercase tracking-wider">Kepada</label>
          <select
            value={toId}
            onChange={e => { setToId(e.target.value); setError(''); }}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
          >
            <option value={BANK_OPTION}>Bank</option>
            {state.players.filter(p => !p.isBankrupt).map(p => (
              <option key={p.id} value={p.id}>{p.name} (RM{p.cash.toLocaleString()})</option>
            ))}
          </select>
        </div>

        {/* AMOUNT */}
        <div className="space-y-2">
          <label className="text-gray-400 text-xs uppercase tracking-wider">Jumlah</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-sm">RM</span>
            <input
              type="number"
              value={amount}
              onChange={e => { setAmount(e.target.value); setError(''); }}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-amber-500"
              placeholder="0"
              min={1}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {presetAmounts.map(p => (
              <button
                key={p}
                onClick={() => { setAmount(String(p)); setError(''); }}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 text-xs font-semibold transition-colors"
              >
                {p >= 1000 ? `${p/1000}k` : p}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        {amt > 0 && (
          <div className="bg-gray-800 rounded-xl p-3 text-sm space-y-1">
            {fromCash !== null && (
              <div className="flex justify-between">
                <span className="text-gray-400">{fromPlayer?.name}</span>
                <span className="text-white">
                  <span className="text-gray-500">RM{fromCash.toLocaleString()}</span>
                  {' → '}
                  <RM amount={fromCash - amt} size="sm" />
                </span>
              </div>
            )}
            {toCash !== null && (
              <div className="flex justify-between">
                <span className="text-gray-400">{toPlayer?.name}</span>
                <span className="text-white">
                  <span className="text-gray-500">RM{toCash.toLocaleString()}</span>
                  {' → '}
                  <RM amount={toCash + amt} size="sm" />
                </span>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleConfirm}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-gray-950 font-black rounded-xl transition-colors"
        >
          Sahkan
        </button>
      </div>
    </div>
  );
}
