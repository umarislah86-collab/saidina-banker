import { useState } from 'react';
import type { GameState } from '../../../types';
import { GROUP_COLOR_MAP } from '../../../types';
import { getProperty } from '../../../data/properties';
import { calculateRent, getRentDescription } from '../../../game/rentCalculator';
import SearchSelect from '../../../components/SearchSelect';
import RM from '../../../components/RM';

interface Props {
  state: GameState;
  onPayRent: (tenantId: string, propertyId: string, amount: number) => void;
  onClose: () => void;
  defaultTenantId?: string;
}

export default function RentModal({ state, onPayRent, onClose, defaultTenantId }: Props) {
  const active = state.players.filter(p => !p.isBankrupt);
  const [tenantId, setTenantId] = useState(defaultTenantId ?? active[0]?.id ?? '');
  const [propertyId, setPropertyId] = useState('');
  const [error, setError] = useState('');

  const rentableProps = state.properties.filter(p => {
    if (!p.ownerId) return false;
    if (p.ownerId === tenantId) return false;
    if (p.mortgaged) return false;
    const owner = state.players.find(pl => pl.id === p.ownerId);
    if (!owner || owner.isBankrupt) return false;
    return true;
  });

  const propertyItems = rentableProps.map(ps => {
    const def = getProperty(ps.propertyId);
    const owner = state.players.find(p => p.id === ps.ownerId);
    return { id: ps.propertyId, label: def.name, sub: `Pemilik: ${owner?.name}` };
  });

  const selectedPropState = state.properties.find(p => p.propertyId === propertyId);
  const selectedDef = propertyId ? getProperty(propertyId) : null;
  const selectedOwner = selectedPropState?.ownerId ? state.players.find(p => p.id === selectedPropState.ownerId) : null;
  const rentAmount = propertyId ? calculateRent(propertyId, state) : 0;
  const rentDesc = propertyId ? getRentDescription(propertyId, state) : '';
  const tenant = state.players.find(p => p.id === tenantId);

  function handleConfirm() {
    if (!propertyId) { setError('Pilih hartanah'); return; }
    if (!tenantId) { setError('Pilih pemain yang bayar'); return; }
    onPayRent(tenantId, propertyId, rentAmount);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 bg-black/70 p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Bayar Sewa</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 text-xs uppercase tracking-wider">Siapa Bayar</label>
          <select
            value={tenantId}
            onChange={e => { setTenantId(e.target.value); setPropertyId(''); setError(''); }}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
          >
            {active.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
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

        {selectedDef && selectedOwner && (
          <div className="bg-gray-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GROUP_COLOR_MAP[selectedDef.colorGroup].hex }} />
              <span className="text-white font-bold">{selectedDef.name}</span>
              <span className="text-gray-500 text-sm">({selectedDef.streetName})</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Pemilik</span>
              <span className="text-white">{selectedOwner.name}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">{rentDesc}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-gray-700">
              <span className="text-gray-300 font-semibold">Sewa</span>
              <RM amount={rentAmount} size="lg" />
            </div>
            {tenant && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">{tenant.name} selepas bayar</span>
                <RM amount={tenant.cash - rentAmount} size="sm" />
              </div>
            )}
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleConfirm}
          disabled={!propertyId}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-40 text-gray-950 font-black rounded-xl"
        >
          Bayar Sewa
        </button>
      </div>
    </div>
  );
}
