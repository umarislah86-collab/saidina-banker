import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameState } from '../../hooks/useGameState';
import { PLAYER_COLOR_MAP, GROUP_COLOR_MAP } from '../../types';
import type { Transaction } from '../../types';
import { getProperty } from '../../data/properties';
import { calculateNetWorth } from '../../game/netWorth';
import RM from '../../components/RM';
import ConfirmModal from '../../components/ConfirmModal';
import AvatarCaptureModal from '../../components/AvatarCaptureModal';
import TransferModal from './modals/TransferModal';
import RentModal from './modals/RentModal';
import PropertyModal from './modals/PropertyModal';
import MortgageModal from './modals/MortgageModal';
import BuildModal from './modals/BuildModal';
import BankruptcyModal from './modals/BankruptcyModal';
import FinishModal from './modals/FinishModal';
import TradeModal from './modals/TradeModal';
import DiceModal from './modals/DiceModal';

type Modal = 'transfer' | 'rent' | 'property' | 'mortgage' | 'build' | 'bankruptcy' | 'reset' | 'finish' | 'trade' | 'dice' | null;

const PASS_GO = 1400;

export default function BankerPage() {
  const navigate = useNavigate();
  const { state, dispatch, resetGame } = useGameState();
  const [modal, setModal] = useState<Modal>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showGameId, setShowGameId] = useState(false);
  const [collectTarget, setCollectTarget] = useState(false);
  const [avatarTarget, setAvatarTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!state) navigate('/');
  }, [state]);

  if (!state) return null;

  const currentPlayer = state.players[state.currentTurnIndex];
  const activePlayers = state.players.filter(p => !p.isBankrupt);

  const actionButtons = [
    { id: 'dice',       label: 'Balingan Dadu', icon: '🎲', color: 'bg-amber-600 hover:bg-amber-500' },
    { id: 'transfer',  label: 'Pindah Wang',   icon: '💸', color: 'bg-blue-600 hover:bg-blue-500' },
    { id: 'rent',      label: 'Bayar Sewa',    icon: '🏠', color: 'bg-green-600 hover:bg-green-500' },
    { id: 'property',  label: 'Beli Tanah',    icon: '📋', color: 'bg-purple-600 hover:bg-purple-500' },
    { id: 'mortgage',  label: 'Gadai / Tebus', icon: '🏦', color: 'bg-orange-600 hover:bg-orange-500' },
    { id: 'build',     label: 'Bangunan',      icon: '🏗', color: 'bg-cyan-600 hover:bg-cyan-500' },
    { id: 'trade',     label: 'Pindah Harta',  icon: '🔄', color: 'bg-teal-600 hover:bg-teal-500' },
    { id: 'bankruptcy',label: 'Muflis',        icon: '⚠',  color: 'bg-red-600 hover:bg-red-500' },
  ] as const;

  function txLabel(tx: Transaction): string {
    switch (tx.type) {
      case 'money_transfer':
      case 'bank_to_player':
      case 'player_to_bank':
        return `Pindah RM${tx.amount?.toLocaleString() ?? 0}`;
      case 'buy_property': return `Beli: ${tx.propertyId ? getProperty(tx.propertyId).name : ''}`;
      case 'pay_rent': return `Sewa: ${tx.propertyId ? getProperty(tx.propertyId).name : ''} — RM${tx.amount?.toLocaleString() ?? 0}`;
      case 'mortgage': return `Gadai: ${tx.propertyId ? getProperty(tx.propertyId).name : ''}`;
      case 'unmortgage': return `Tebus: ${tx.propertyId ? getProperty(tx.propertyId).name : ''}`;
      case 'build_house': return `Bina Rumah: ${tx.propertyId ? getProperty(tx.propertyId).name : ''}`;
      case 'sell_house': return `Jual Rumah: ${tx.propertyId ? getProperty(tx.propertyId).name : ''}`;
      case 'build_hotel': return `Bina Hotel: ${tx.propertyId ? getProperty(tx.propertyId).name : ''}`;
      case 'sell_hotel': return `Jual Hotel: ${tx.propertyId ? getProperty(tx.propertyId).name : ''}`;
      case 'bankruptcy_to_player': return `Muflis → Pemain`;
      case 'bankruptcy_to_bank': return `Muflis → Bank`;
      case 'collect_start': return `Lalu Mula +RM${PASS_GO.toLocaleString()}`;
      case 'pay_tax': return `Cukai RM${tx.amount?.toLocaleString() ?? 0}`;
      case 'transfer_property': return `Pindah hartanah`;
      default: return tx.type;
    }
  }

  const recentTx = [...state.transactions].reverse().slice(0, 15);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-white font-black text-lg leading-none">Saidina</h1>
          <p className="text-gray-500 text-xs">Giliran ke-{state.turnNumber}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGameId(!showGameId)}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg"
          >
            ID
          </button>
          <button
            onClick={() => setModal('finish')}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold rounded-lg"
          >
            Tamat
          </button>
          <button
            onClick={() => navigate('/display')}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg"
          >
            TV
          </button>
          <button
            onClick={() => setModal('reset')}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg"
          >
            Reset
          </button>
        </div>
      </header>

      {showGameId && (
        <div className="bg-gray-900 border-b border-gray-700 px-4 py-2 text-center">
          <p className="text-gray-400 text-xs mb-1">Game ID untuk skrin TV</p>
          <p className="text-amber-400 font-mono text-sm font-bold select-all">{state.gameId}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-4">
        {/* Current Turn Banner */}
        <div
          className="px-4 py-4 flex items-center justify-between border-l-4"
          style={{ borderColor: PLAYER_COLOR_MAP[currentPlayer?.color ?? 'red'].hex }}
        >
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Giliran</p>
            <p className="text-white font-black text-xl">{currentPlayer?.name}</p>
            <RM amount={currentPlayer?.cash ?? 0} size="md" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => dispatch({ type: 'UNDO' })}
              disabled={!state.snapshot}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-300 text-xs font-semibold rounded-xl"
            >
              Undo
            </button>
            <button
              onClick={() => dispatch({ type: 'NEXT_TURN' })}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-gray-950 text-sm font-black rounded-xl"
            >
              Seterusnya →
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 mb-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Aksi Cepat</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCollectTarget(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-3 py-2 rounded-xl whitespace-nowrap flex-shrink-0"
            >
              Lalu Mula +RM1,400
            </button>
            <button
              onClick={() => dispatch({ type: 'TRANSFER', fromId: currentPlayer.id, toId: 'bank', amount: 400 })}
              className="bg-red-700 hover:bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-xl whitespace-nowrap flex-shrink-0"
            >
              Denda RM400
            </button>
            <button
              onClick={() => dispatch({ type: 'TRANSFER', fromId: currentPlayer.id, toId: 'bank', amount: 1400 })}
              className="bg-red-700 hover:bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-xl whitespace-nowrap flex-shrink-0"
            >
              Cukai Pendapatan RM1,400
            </button>
            <button
              onClick={() => dispatch({ type: 'TRANSFER', fromId: currentPlayer.id, toId: 'bank', amount: 700 })}
              className="bg-red-700 hover:bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-xl whitespace-nowrap flex-shrink-0"
            >
              Cukai Jalan RM700
            </button>
          </div>
        </div>

        {/* Collect Start — who passes GO */}
        {collectTarget && (
          <div className="mx-4 mb-4 bg-gray-900 border border-amber-600 rounded-xl p-3">
            <p className="text-amber-400 text-sm font-bold mb-2">Siapa Lalu Mula?</p>
            <div className="flex flex-wrap gap-2">
              {activePlayers.map(p => (
                <button
                  key={p.id}
                  onClick={() => { dispatch({ type: 'COLLECT_START', playerId: p.id, amount: PASS_GO }); setCollectTarget(false); }}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 text-sm font-black rounded-lg"
                >
                  {p.name}
                </button>
              ))}
              <button
                onClick={() => setCollectTarget(false)}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm rounded-lg"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Main Action Buttons */}
        <div className="px-4 mb-4">
          <div className="grid grid-cols-3 gap-2">
            {actionButtons.map(btn => (
              <button
                key={btn.id}
                onClick={() => setModal(btn.id as Modal)}
                className={`${btn.color} text-white rounded-xl py-4 flex flex-col items-center gap-1.5 active:scale-95 transition-transform`}
              >
                <span className="text-2xl">{btn.icon}</span>
                <span className="text-xs font-bold text-center leading-tight">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Player Cards */}
        <div className="px-4 mb-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Pemain</p>
          <div className="space-y-2">
            {state.players.map(player => {
              const ownedProps = state.properties.filter(p => p.ownerId === player.id);
              const netWorth = calculateNetWorth(player.id, state);
              const isCurrent = player.id === currentPlayer?.id;

              return (
                <div
                  key={player.id}
                  className={`bg-gray-900 rounded-xl p-3 border ${
                    player.isBankrupt ? 'border-gray-800 opacity-50' : isCurrent ? 'border-amber-500/50' : 'border-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {player.avatar ? (
                        <img
                          src={player.avatar}
                          alt={player.name}
                          onClick={() => !player.isBankrupt && setAvatarTarget({ id: player.id, name: player.name })}
                          className="w-8 h-8 rounded-full object-cover cursor-pointer ring-1 ring-gray-700"
                        />
                      ) : (
                        <button
                          onClick={() => !player.isBankrupt && setAvatarTarget({ id: player.id, name: player.name })}
                          className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500 text-xs hover:bg-gray-700"
                          title="Tambah avatar"
                        >
                          📷
                        </button>
                      )}
                      <span className={`font-bold text-sm ${isCurrent ? 'text-white' : 'text-gray-300'}`}>
                        {player.name}
                        {player.isBankrupt && <span className="ml-1 text-red-400 text-xs">[MUFLIS]</span>}
                        {isCurrent && !player.isBankrupt && <span className="ml-1 text-amber-400 text-xs">▶</span>}
                      </span>
                    </div>
                    <div className="text-right">
                      <RM amount={player.cash} size="sm" />
                      <p className="text-gray-500 text-xs">NW: RM{netWorth.toLocaleString()} · Petak {state.positions?.[player.id] ?? 0}</p>
                    </div>
                  </div>

                  {ownedProps.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {ownedProps.map(ps => {
                        const def = getProperty(ps.propertyId);
                        const gc = GROUP_COLOR_MAP[def.colorGroup];
                        return (
                          <span
                            key={ps.propertyId}
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: gc.hex + '22', borderLeft: `2px solid ${gc.hex}`, color: gc.hex }}
                          >
                            {def.name}
                            {ps.mortgaged && ' M'}
                            {ps.hotel && ' 🏨'}
                            {!ps.hotel && ps.houses > 0 && ` ×${ps.houses}`}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction History */}
        <div className="px-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full text-left flex items-center justify-between py-2"
          >
            <p className="text-gray-500 text-xs uppercase tracking-wider">Sejarah ({state.transactions.length})</p>
            <span className="text-gray-600 text-xs">{showHistory ? '▲' : '▼'}</span>
          </button>
          {showHistory && (
            <div className="space-y-0">
              {recentTx.length === 0 && <p className="text-gray-600 text-sm text-center py-4">Tiada rekod</p>}
              {recentTx.map(tx => {
                const fromPlayer = tx.fromPlayerId ? state.players.find(p => p.id === tx.fromPlayerId) : null;
                return (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-800">
                    <div>
                      <p className="text-gray-300 text-sm">{txLabel(tx)}</p>
                      {fromPlayer && <p className="text-gray-600 text-xs">{fromPlayer.name}</p>}
                    </div>
                    {tx.amount !== undefined && tx.amount > 0 && <RM amount={tx.amount} size="sm" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal === 'dice' && (
        <DiceModal
          state={state}
          onMovePlayer={(playerId, newPosition, wasJailed) => dispatch({ type: 'MOVE_PLAYER', playerId, newPosition, wasJailed })}
          onSetJailTurns={(playerId, turns) => dispatch({ type: 'SET_JAIL_TURNS', playerId, turns })}
          onTransfer={(fromId, toId, amount) => dispatch({ type: 'TRANSFER', fromId, toId, amount })}
          onCollectStart={(playerId) => dispatch({ type: 'COLLECT_START', playerId, amount: PASS_GO })}
          onBuyProperty={(playerId, propertyId) => dispatch({ type: 'BUY_PROPERTY', playerId, propertyId })}
          onPayRent={(tenantId, propertyId, amount) => dispatch({ type: 'PAY_RENT', tenantId, propertyId, amount })}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'transfer' && (
        <TransferModal
          state={state}
          onTransfer={(f, t, a) => dispatch({ type: 'TRANSFER', fromId: f, toId: t, amount: a })}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'rent' && (
        <RentModal
          state={state}
          onPayRent={(tenantId, propertyId, amount) => dispatch({ type: 'PAY_RENT', tenantId, propertyId, amount })}
          onClose={() => setModal(null)}
          defaultTenantId={currentPlayer?.id}
        />
      )}
      {modal === 'property' && (
        <PropertyModal
          state={state}
          onBuy={(playerId, propertyId) => dispatch({ type: 'BUY_PROPERTY', playerId, propertyId })}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'mortgage' && (
        <MortgageModal
          state={state}
          onMortgage={(playerId, propertyId) => dispatch({ type: 'MORTGAGE', playerId, propertyId })}
          onUnmortgage={(playerId, propertyId) => dispatch({ type: 'UNMORTGAGE', playerId, propertyId })}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'build' && (
        <BuildModal
          state={state}
          onBuildHouse={(playerId, propertyId) => dispatch({ type: 'BUILD_HOUSE', playerId, propertyId })}
          onBuildHousesMulti={(playerId, propertyId, count) => dispatch({ type: 'BUILD_HOUSES_MULTI', playerId, propertyId, count })}
          onSellHouse={(playerId, propertyId) => dispatch({ type: 'SELL_HOUSE', playerId, propertyId })}
          onSellHousesMulti={(playerId, propertyId, count) => dispatch({ type: 'SELL_HOUSES_MULTI', playerId, propertyId, count })}
          onBuildHotel={(playerId, propertyId) => dispatch({ type: 'BUILD_HOTEL', playerId, propertyId })}
          onSellHotel={(playerId, propertyId) => dispatch({ type: 'SELL_HOTEL', playerId, propertyId })}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'trade' && (
        <TradeModal
          state={state}
          onTransfer={(fromId, toId, propertyId) => dispatch({ type: 'TRANSFER_PROPERTY', fromId, toId, propertyId })}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'bankruptcy' && (
        <BankruptcyModal
          state={state}
          onBankruptToPlayer={(bankruptId, creditorId) => dispatch({ type: 'BANKRUPT_TO_PLAYER', bankruptId, creditorId })}
          onBankruptToBank={(bankruptId) => dispatch({ type: 'BANKRUPT_TO_BANK', bankruptId })}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'finish' && (
        <FinishModal
          state={state}
          onFinish={() => { resetGame(); navigate('/'); }}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'reset' && (
        <ConfirmModal
          title="Reset Permainan?"
          message="Semua data permainan akan dipadam. Tindakan ini tidak boleh dibatalkan."
          confirmLabel="Reset"
          danger
          onConfirm={() => { resetGame(); navigate('/'); }}
          onCancel={() => setModal(null)}
        />
      )}
      {avatarTarget && (
        <AvatarCaptureModal
          playerId={avatarTarget.id}
          playerName={avatarTarget.name}
          onCapture={dataUrl => dispatch({ type: 'SET_AVATAR', playerId: avatarTarget.id, avatar: dataUrl })}
          onClose={() => setAvatarTarget(null)}
        />
      )}
    </div>
  );
}
