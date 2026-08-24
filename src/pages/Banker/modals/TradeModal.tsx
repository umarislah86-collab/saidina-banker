import { useState } from 'react';
import type { GameState } from '../../../types';
import { GROUP_COLOR_MAP } from '../../../types';
import { getProperty } from '../../../data/properties';
import SearchSelect from '../../../components/SearchSelect';
import RM from '../../../components/RM';

interface Props {
  state: GameState;
  onTransfer: (fromId: string, toId: string, propertyId: string) => void;
  onClose: () => void;
}

function propertyFullValue(propState: { houses: number; hotel: boolean; mortgaged: boolean }, def: ReturnType<typeof getProperty>): number {
  if (propState.mortgaged) return def.mortgageValue;
  return def.basePrice + propState.houses * def.houseBuildCost + (propState.hotel ? 4 * def.houseBuildCost + def.hotelBuildCost : 0);
}

export default function TradeModal({ state, onTransfer, onClose }: Props) {
  const active = state.players.filter(p => !p.isBankrupt);
  const [fromId, setFromId] = useState(state.players[state.currentTurnIndex]?.id ?? active[0]?.id ?? '');
  const [toId, setToId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [error, setError] = useState('');

  const fromPlayer = state.players.find(p => p.id === fromId);
  const toPlayer = toId ? state.players.find(p => p.id === toId) : null;

  const fromProps = state.properties.filter(p => p.ownerId === fromId);
  const propertyItems = fromProps.map(ps => {
    const def = getProperty(ps.propertyId);
    const val = propertyFullValue(ps, def);
    const dev = ps.hotel ? '🏨' : ps.houses > 0 ? `🏠×${ps.houses}` : '';
    return { id: ps.propertyId, label: def.name, sub: `RM${val.toLocaleString()} ${dev}${ps.mortgaged ? ' [GADAI]' : ''}` };
  });

  const toOptions = active.filter(p => p.id !== fromId);

  const selectedPropState = state.properties.find(p => p.propertyId === propertyId);
  const selectedDef = propertyId ? getProperty(propertyId) : null;
  const fullValue = selectedDef && selectedPropState ? propertyFullValue(selectedPropState, selectedDef) : 0;

  function handleConfirm() {
    if (!fromId) { setError('Pilih pemain yang bagi'); return; }
    if (!toId) { setError('Pilih pemain yang terima'); return; }
    if (!propertyId) { setError('Pilih hartanah'); return; }
    onTransfer(fromId, toId, propertyId);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 bg-black/70 p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Pindah Harta</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        <p className="text-gray-500 text-xs">Gunakan ini untuk selesaikan hutang — pindah hartanah (termasuk rumah/hotel) kepada pemain lain pada nilai penuh.</p>

        <div className="space-y-1">
          <label className="text-gray-400 text-xs uppercase tracking-wider">Dari (Pemberi)</label>
          <select
            value={fromId}
            onChange={e => { setFromId(e.target.value); setPropertyId(''); setError(''); }}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
          >
            {active.map(p => <option key={p.id} value={p.id}>{p.name} — RM{p.cash.toLocaleString()}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 text-xs uppercase tracking-wider">Hartanah</label>
          {fromProps.length === 0 ? (
            <p className="text-gray-600 text-sm">Tiada hartanah</p>
          ) : (
            <SearchSelect
              items={propertyItems}
              value={propertyId}
              onChange={id => { setPropertyId(id); setError(''); }}
              placeholder="Taip nama hartanah..."
            />
          )}
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 text-xs uppercase tracking-wider">Kepada (Penerima)</label>
          <select
            value={toId}
            onChange={e => { setToId(e.target.value); setError(''); }}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="">-- Pilih penerima --</option>
            {toOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {selectedDef && selectedPropState && (
          <div className="bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GROUP_COLOR_MAP[selectedDef.colorGroup].hex }} />
              <span className="text-white font-bold">{selectedDef.name}</span>
              <span className="text-gray-400">
                {selectedPropState.hotel ? '🏨' : selectedPropState.houses > 0 ? `🏠×${selectedPropState.houses}` : 'Kosong'}
                {selectedPropState.mortgaged ? ' [GADAI]' : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Harga tanah</span>
              <RM amount={selectedDef.basePrice} size="sm" />
            </div>
            {selectedPropState.houses > 0 && !selectedPropState.hotel && (
              <div className="flex justify-between">
                <span className="text-gray-400">{selectedPropState.houses} rumah × RM{selectedDef.houseBuildCost.toLocaleString()}</span>
                <RM amount={selectedPropState.houses * selectedDef.houseBuildCost} size="sm" />
              </div>
            )}
            {selectedPropState.hotel && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">4 rumah × RM{selectedDef.houseBuildCost.toLocaleString()}</span>
                  <RM amount={4 * selectedDef.houseBuildCost} size="sm" />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Hotel</span>
                  <RM amount={selectedDef.hotelBuildCost} size="sm" />
                </div>
              </>
            )}
            <div className="flex justify-between pt-1 border-t border-gray-700">
              <span className="text-white font-semibold">Nilai penuh</span>
              <RM amount={fullValue} size="md" />
            </div>
            {toPlayer && (
              <div className="flex justify-between text-xs text-gray-500 pt-0.5">
                <span>{fromPlayer?.name} → {toPlayer.name}</span>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleConfirm}
          disabled={!propertyId || !toId}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-40 text-gray-950 font-black rounded-xl"
        >
          Pindah Harta
        </button>
      </div>
    </div>
  );
}
