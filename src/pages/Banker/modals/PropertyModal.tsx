import { useState } from 'react';
import type { GameState } from '../../../types';
import { GROUP_COLOR_MAP } from '../../../types';
import { getProperty } from '../../../data/properties';
import { validateBuyProperty } from '../../../game/validation';
import SearchSelect from '../../../components/SearchSelect';
import RM from '../../../components/RM';

interface Props {
  state: GameState;
  onBuy: (playerId: string, propertyId: string) => void;
  onClose: () => void;
}

export default function PropertyModal({ state, onBuy, onClose }: Props) {
  const active = state.players.filter(p => !p.isBankrupt);
  const currentPlayer = state.players[state.currentTurnIndex];
  const [buyerId, setBuyerId] = useState(currentPlayer?.id ?? active[0]?.id ?? '');
  const [propertyId, setPropertyId] = useState('');
  const [error, setError] = useState('');

  const unowned = state.properties.filter(p => !p.ownerId);
  const buyer = state.players.find(p => p.id === buyerId);
  const selectedDef = propertyId ? getProperty(propertyId) : null;

  const propertyItems = unowned.map(ps => {
    const def = getProperty(ps.propertyId);
    return { id: ps.propertyId, label: def.name, sub: `RM${def.basePrice.toLocaleString()} — ${def.streetName}` };
  });

  function handleConfirm() {
    if (!propertyId) { setError('Pilih hartanah'); return; }
    const v = validateBuyProperty(buyerId, propertyId, state);
    if (!v.valid) { setError(v.error!); return; }
    onBuy(buyerId, propertyId);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Beli Hartanah</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 text-xs uppercase tracking-wider">Pembeli</label>
          <select
            value={buyerId}
            onChange={e => { setBuyerId(e.target.value); setError(''); }}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
          >
            {active.map(p => (
              <option key={p.id} value={p.id}>{p.name} — RM{p.cash.toLocaleString()}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 text-xs uppercase tracking-wider">Hartanah</label>
          <SearchSelect
            items={propertyItems}
            value={propertyId}
            onChange={id => { setPropertyId(id); setError(''); }}
            placeholder="Taip nama hartanah..."
          />
        </div>

        {selectedDef && buyer && (
          <div className="bg-gray-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GROUP_COLOR_MAP[selectedDef.colorGroup].hex }} />
              <span className="text-white font-bold">{selectedDef.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Harga</span>
              <RM amount={selectedDef.basePrice} size="sm" />
            </div>
            <div className="flex justify-between text-sm border-t border-gray-700 pt-2">
              <span className="text-gray-300 font-semibold">Baki selepas beli</span>
              <RM amount={buyer.cash - selectedDef.basePrice} size="sm" />
            </div>
            {buyer.cash < selectedDef.basePrice && <p className="text-red-400 text-xs">⚠ Tak cukup wang</p>}
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleConfirm}
          disabled={!propertyId || (buyer ? buyer.cash < (selectedDef?.basePrice ?? 0) : false)}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-40 text-gray-950 font-black rounded-xl"
        >
          Beli
        </button>
      </div>
    </div>
  );
}
