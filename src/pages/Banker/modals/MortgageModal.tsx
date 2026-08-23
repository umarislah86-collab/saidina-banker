import { useState } from 'react';
import type { GameState } from '../../../types';
import { GROUP_COLOR_MAP } from '../../../types';
import { getProperty } from '../../../data/properties';
import { validateMortgage, validateUnmortgage } from '../../../game/validation';
import RM from '../../../components/RM';

interface Props {
  state: GameState;
  onMortgage: (playerId: string, propertyId: string) => void;
  onUnmortgage: (playerId: string, propertyId: string) => void;
  onClose: () => void;
}

type Tab = 'mortgage' | 'unmortgage';

export default function MortgageModal({ state, onMortgage, onUnmortgage, onClose }: Props) {
  const active = state.players.filter(p => !p.isBankrupt);
  const [tab, setTab] = useState<Tab>('mortgage');
  const [playerId, setPlayerId] = useState(state.players[state.currentTurnIndex]?.id ?? active[0]?.id ?? '');
  const [propertyId, setPropertyId] = useState('');
  const [error, setError] = useState('');

  const playerProps = state.properties.filter(p => p.ownerId === playerId);
  const mortgageableProps = playerProps.filter(p => !p.mortgaged && !p.hotel && p.houses === 0);
  const unmortgageableProps = playerProps.filter(p => p.mortgaged);
  const props = tab === 'mortgage' ? mortgageableProps : unmortgageableProps;

  const selectedDef = propertyId ? getProperty(propertyId) : null;
  const player = state.players.find(p => p.id === playerId);

  function handleConfirm() {
    if (!propertyId) { setError('Pilih hartanah'); return; }
    if (tab === 'mortgage') {
      const v = validateMortgage(playerId, propertyId, state);
      if (!v.valid) { setError(v.error!); return; }
      onMortgage(playerId, propertyId);
    } else {
      const v = validateUnmortgage(playerId, propertyId, state);
      if (!v.valid) { setError(v.error!); return; }
      onUnmortgage(playerId, propertyId);
    }
    onClose();
  }

  const totalUnmortgageCost = selectedDef
    ? selectedDef.mortgageValue + selectedDef.mortgageInterest
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 bg-black/70 p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Gadai / Tebus</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-800 rounded-xl p-1 gap-1">
          {(['mortgage', 'unmortgage'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setPropertyId(''); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t ? 'bg-amber-500 text-gray-950' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'mortgage' ? 'Gadai' : 'Tebus Gadai'}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 text-xs uppercase tracking-wider">Pemain</label>
          <select
            value={playerId}
            onChange={e => { setPlayerId(e.target.value); setPropertyId(''); setError(''); }}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
          >
            {active.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 text-xs uppercase tracking-wider">Hartanah</label>
          <select
            value={propertyId}
            onChange={e => { setPropertyId(e.target.value); setError(''); }}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="">-- Pilih hartanah --</option>
            {props.map(ps => {
              const def = getProperty(ps.propertyId);
              return (
                <option key={ps.propertyId} value={ps.propertyId}>
                  {def.name}{tab === 'unmortgage' ? ' [DIGADAI]' : ''}
                </option>
              );
            })}
          </select>
          {props.length === 0 && (
            <p className="text-gray-500 text-xs">
              {tab === 'mortgage' ? 'Tiada hartanah boleh digadai' : 'Tiada hartanah yang digadai'}
            </p>
          )}
        </div>

        {selectedDef && player && (
          <div className="bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GROUP_COLOR_MAP[selectedDef.colorGroup].hex }} />
              <span className="text-white font-bold">{selectedDef.name}</span>
            </div>
            {tab === 'mortgage' ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Nilai Gadaian</span>
                  <RM amount={selectedDef.mortgageValue} size="sm" />
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-2">
                  <span className="text-gray-300 font-semibold">Wang selepas gadai</span>
                  <RM amount={player.cash + selectedDef.mortgageValue} size="sm" />
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Gadaian asal</span>
                  <RM amount={selectedDef.mortgageValue} size="sm" />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Faedah</span>
                  <RM amount={selectedDef.mortgageInterest} size="sm" />
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-2">
                  <span className="text-gray-300 font-semibold">Jumlah bayar</span>
                  <RM amount={totalUnmortgageCost} size="sm" />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Wang selepas tebus</span>
                  <RM amount={player.cash - totalUnmortgageCost} size="sm" />
                </div>
                {player.cash < totalUnmortgageCost && (
                  <p className="text-red-400 text-xs">⚠ Tak cukup wang</p>
                )}
              </>
            )}
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleConfirm}
          disabled={!propertyId}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-40 text-gray-950 font-black rounded-xl transition-colors"
        >
          {tab === 'mortgage' ? 'Gadai' : 'Tebus Gadai'}
        </button>
      </div>
    </div>
  );
}
