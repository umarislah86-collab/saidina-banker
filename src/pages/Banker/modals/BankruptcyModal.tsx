import { useState } from 'react';
import type { GameState } from '../../../types';
import { calculateNetWorth } from '../../../game/netWorth';
import RM from '../../../components/RM';

interface Props {
  state: GameState;
  onBankruptToPlayer: (bankruptId: string, creditorId: string) => void;
  onBankruptToBank: (bankruptId: string) => void;
  onClose: () => void;
}

type Option = 'player' | 'bank';

export default function BankruptcyModal({ state, onBankruptToPlayer, onBankruptToBank, onClose }: Props) {
  const active = state.players.filter(p => !p.isBankrupt);
  const [bankruptId, setBankruptId] = useState(active[0]?.id ?? '');
  const [option, setOption] = useState<Option>('player');
  const [creditorId, setCreditorId] = useState('');
  const [confirm, setConfirm] = useState(false);

  const bankrupt = state.players.find(p => p.id === bankruptId);
  const creditorOptions = active.filter(p => p.id !== bankruptId);
  const netWorth = bankruptId ? calculateNetWorth(bankruptId, state) : 0;
  const propertyCount = state.properties.filter(p => p.ownerId === bankruptId).length;

  function handleConfirm() {
    if (!confirm) { setConfirm(true); return; }
    if (option === 'player') {
      if (!creditorId) return;
      onBankruptToPlayer(bankruptId, creditorId);
    } else {
      onBankruptToBank(bankruptId);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 bg-black/70 p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-red-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-red-400 font-black text-lg uppercase tracking-wider">⚠ Muflis</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 text-xs uppercase tracking-wider">Siapa Muflis</label>
          <select
            value={bankruptId}
            onChange={e => { setBankruptId(e.target.value); setCreditorId(''); setConfirm(false); }}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
          >
            {active.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {bankrupt && (
          <div className="bg-gray-800 rounded-xl p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Wang tunai</span>
              <RM amount={bankrupt.cash} size="sm" />
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Hartanah</span>
              <span className="text-white">{propertyCount} bidang</span>
            </div>
            <div className="flex justify-between border-t border-gray-700 pt-1">
              <span className="text-gray-300 font-semibold">Anggaran nilai</span>
              <RM amount={netWorth} size="sm" />
            </div>
          </div>
        )}

        {/* Option */}
        <div className="space-y-2">
          <label className="text-gray-400 text-xs uppercase tracking-wider">Pindah Aset Kepada</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setOption('player'); setConfirm(false); }}
              className={`p-3 rounded-xl text-sm font-semibold transition-colors ${
                option === 'player' ? 'bg-amber-500 text-gray-950' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Pemain Lain
            </button>
            <button
              onClick={() => { setOption('bank'); setCreditorId(''); setConfirm(false); }}
              className={`p-3 rounded-xl text-sm font-semibold transition-colors ${
                option === 'bank' ? 'bg-amber-500 text-gray-950' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Bank
            </button>
          </div>
        </div>

        {option === 'player' && (
          <div className="space-y-1">
            <label className="text-gray-400 text-xs uppercase tracking-wider">Penerima</label>
            <select
              value={creditorId}
              onChange={e => { setCreditorId(e.target.value); setConfirm(false); }}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="">-- Pilih pemain --</option>
              {creditorOptions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {option === 'bank' && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-3">
            <p className="text-red-300 text-sm">
              Semua hartanah akan dikembalikan ke Bank. Rumah dan hotel dimusnahkan.
            </p>
          </div>
        )}

        {confirm && (
          <div className="bg-red-900/50 border border-red-700 rounded-xl p-3">
            <p className="text-red-300 text-sm font-bold">
              Tindakan ini tidak boleh dibatalkan. Tekan sekali lagi untuk sahkan.
            </p>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={option === 'player' && !creditorId}
          className="w-full py-3.5 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-40 text-white font-black rounded-xl transition-colors"
        >
          {confirm ? '⚠ SAHKAN MUFLIS' : 'Isytihar Muflis'}
        </button>
      </div>
    </div>
  );
}
