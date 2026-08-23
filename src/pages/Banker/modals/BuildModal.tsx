import { useState } from 'react';
import type { GameState } from '../../../types';
import { GROUP_COLOR_MAP } from '../../../types';
import { getProperty } from '../../../data/properties';
import { validateBuildHouse, validateBuildHotel } from '../../../game/validation';
import RM from '../../../components/RM';

interface Props {
  state: GameState;
  onBuildHouse: (playerId: string, propertyId: string) => void;
  onBuildHousesMulti: (playerId: string, propertyId: string, count: number) => void;
  onSellHouse: (playerId: string, propertyId: string) => void;
  onBuildHotel: (playerId: string, propertyId: string) => void;
  onSellHotel: (playerId: string, propertyId: string) => void;
  onClose: () => void;
}

type BuildAction = 'build_house' | 'sell_house' | 'build_hotel' | 'sell_hotel';

export default function BuildModal({ state, onBuildHouse, onBuildHousesMulti, onSellHouse, onBuildHotel, onSellHotel, onClose }: Props) {
  const active = state.players.filter(p => !p.isBankrupt);
  const [playerId, setPlayerId] = useState(state.players[state.currentTurnIndex]?.id ?? active[0]?.id ?? '');
  const [propertyId, setPropertyId] = useState('');
  const [action, setAction] = useState<BuildAction>('build_house');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  const playerProps = state.properties.filter(p =>
    p.ownerId === playerId && getProperty(p.propertyId).propertyType === 'standard'
  );

  const selectedDef = propertyId ? getProperty(propertyId) : null;
  const selectedPropState = state.properties.find(p => p.propertyId === propertyId);
  const player = state.players.find(p => p.id === playerId);

  const maxHousesCanBuild = selectedPropState && !selectedPropState.hotel
    ? Math.min(4 - selectedPropState.houses, player ? Math.floor(player.cash / (selectedDef?.houseBuildCost ?? 1)) : 0)
    : 0;

  function handleConfirm() {
    if (!propertyId) { setError('Pilih hartanah'); return; }

    if (action === 'build_house') {
      const v = validateBuildHouse(playerId, propertyId, state);
      if (!v.valid) { setError(v.error!); return; }
      if (quantity > 1) {
        onBuildHousesMulti(playerId, propertyId, quantity);
      } else {
        onBuildHouse(playerId, propertyId);
      }
    } else if (action === 'sell_house') {
      if (!selectedPropState || selectedPropState.houses === 0) { setError('Tiada rumah untuk dijual'); return; }
      onSellHouse(playerId, propertyId);
    } else if (action === 'build_hotel') {
      const v = validateBuildHotel(playerId, propertyId, state);
      if (!v.valid) { setError(v.error!); return; }
      onBuildHotel(playerId, propertyId);
    } else {
      if (!selectedPropState?.hotel) { setError('Tiada hotel untuk dijual'); return; }
      onSellHotel(playerId, propertyId);
    }
    onClose();
  }

  function getCost() {
    if (!selectedDef) return 0;
    if (action === 'build_house') return selectedDef.houseBuildCost * quantity;
    if (action === 'sell_house') return Math.floor(selectedDef.houseBuildCost / 2);
    if (action === 'build_hotel') return selectedDef.hotelBuildCost;
    return Math.floor(selectedDef.hotelBuildCost / 2);
  }

  const cost = getCost();
  const isSellingAction = action === 'sell_house' || action === 'sell_hotel';

  const actions: { id: BuildAction; label: string; emoji: string }[] = [
    { id: 'build_house', label: 'Bina Rumah', emoji: '🏠' },
    { id: 'sell_house', label: 'Jual Rumah', emoji: '🏚' },
    { id: 'build_hotel', label: 'Bina Hotel', emoji: '🏨' },
    { id: 'sell_hotel', label: 'Jual Hotel', emoji: '🏗' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Bangunan</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {actions.map(a => (
            <button
              key={a.id}
              onClick={() => { setAction(a.id); setQuantity(1); setError(''); }}
              className={`p-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${
                action === a.id ? 'bg-amber-500 text-gray-950' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <span>{a.emoji}</span> {a.label}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 text-xs uppercase tracking-wider">Pemain</label>
          <select
            value={playerId}
            onChange={e => { setPlayerId(e.target.value); setPropertyId(''); setQuantity(1); setError(''); }}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
          >
            {active.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 text-xs uppercase tracking-wider">Hartanah</label>
          <select
            value={propertyId}
            onChange={e => { setPropertyId(e.target.value); setQuantity(1); setError(''); }}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="">-- Pilih hartanah --</option>
            {playerProps.map(ps => {
              const def = getProperty(ps.propertyId);
              const dev = ps.hotel ? '🏨' : ps.houses > 0 ? `🏠×${ps.houses}` : '';
              return (
                <option key={ps.propertyId} value={ps.propertyId}>
                  {def.name} {dev}{ps.mortgaged ? ' [GADAI]' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Quantity selector — only for build_house */}
        {action === 'build_house' && propertyId && maxHousesCanBuild > 0 && (
          <div className="space-y-1">
            <label className="text-gray-400 text-xs uppercase tracking-wider">Bilangan Rumah</label>
            <div className="flex gap-2">
              {Array.from({ length: maxHousesCanBuild }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setQuantity(n)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                    quantity === n ? 'bg-amber-500 text-gray-950' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedDef && player && selectedPropState && (
          <div className="bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: GROUP_COLOR_MAP[selectedDef.colorGroup].hex }} />
              <span className="text-white font-bold">{selectedDef.name}</span>
              <span className="text-gray-400">
                {selectedPropState.hotel ? '🏨 Hotel' : selectedPropState.houses > 0 ? `🏠 ${selectedPropState.houses} rumah` : 'Kosong'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{isSellingAction ? 'Terima' : `Kos${action === 'build_house' && quantity > 1 ? ` ×${quantity}` : ''}`}</span>
              <RM amount={cost} size="sm" />
            </div>
            <div className="flex justify-between border-t border-gray-700 pt-2">
              <span className="text-gray-300">Wang selepas</span>
              <RM amount={isSellingAction ? player.cash + cost : player.cash - cost} size="sm" />
            </div>
            {action === 'build_hotel' && <p className="text-gray-400 text-xs">⚠ 4 rumah akan diserah semula ke Bank</p>}
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleConfirm}
          disabled={!propertyId}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-40 text-gray-950 font-black rounded-xl"
        >
          Sahkan
        </button>
      </div>
    </div>
  );
}
