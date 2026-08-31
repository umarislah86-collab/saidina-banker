import { useState } from 'react';
import type { GameState } from '../../../types';
import { GROUP_COLOR_MAP } from '../../../types';
import { getSquare } from '../../../data/board';
import { getProperty } from '../../../data/properties';
import { calculateRent } from '../../../game/rent';
import RM from '../../../components/RM';

interface Props {
  state: GameState;
  onMovePlayer: (playerId: string, newPosition: number, wasJailed: boolean) => void;
  onSetJailTurns: (playerId: string, turns: number) => void;
  onTransfer: (fromId: string, toId: string | 'bank', amount: number) => void;
  onCollectStart: (playerId: string) => void;
  onBuyProperty: (playerId: string, propertyId: string) => void;
  onPayRent: (tenantId: string, propertyId: string, amount: number) => void;
  onClose: () => void;
}

type Phase = 'jail_options' | 'jail_try_double' | 'normal_input' | 'result';

const DIE = [1, 2, 3, 4, 5, 6];
const BAIL = 500;

function squareEmoji(type: string): string {
  switch (type) {
    case 'mula': return '🏁';
    case 'tax': return '💸';
    case 'denda': return '🚫';
    case 'jail': return '👀';
    case 'go_to_jail': return '🚔';
    case 'chance': return '❓';
    default: return '🏘';
  }
}

export default function DiceModal({
  state, onMovePlayer, onSetJailTurns, onTransfer, onCollectStart, onBuyProperty, onPayRent, onClose,
}: Props) {
  const active = state.players.filter(p => !p.isBankrupt);
  const currentPlayer = state.players[state.currentTurnIndex];
  const [playerId, setPlayerId] = useState(currentPlayer?.id ?? active[0]?.id ?? '');

  const inJail = state.inJail?.[playerId] ?? false;
  const jailTurns = state.jailTurns?.[playerId] ?? 0;
  const currentPos = state.positions?.[playerId] ?? 0;

  const [phase, setPhase] = useState<Phase>(inJail ? 'jail_options' : 'normal_input');
  const [d1, setD1] = useState<number | null>(null);
  const [d2, setD2] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [result, setResult] = useState<{ newPos: number; passedMula: boolean } | null>(null);
  const [jailMsg, setJailMsg] = useState('');
  const [bailed, setBailed] = useState(false);
  const [forcedBail, setForcedBail] = useState(false);

  const player = state.players.find(p => p.id === playerId);

  function resetForPlayer(id: string) {
    setPlayerId(id);
    const jail = state.inJail?.[id] ?? false;
    setPhase(jail ? 'jail_options' : 'normal_input');
    setD1(null); setD2(null); setTotal(null);
    setResult(null); setJailMsg(''); setBailed(false); setForcedBail(false);
  }

  function handleBail() {
    onTransfer(playerId, 'bank', BAIL);
    onMovePlayer(playerId, 10, false);
    setBailed(true);
    setPhase('normal_input');
  }

  function handleDoubleCheck() {
    if (d1 === null || d2 === null) return;
    if (d1 === d2) {
      // Freed! Move d1+d2 from pos 10
      const newPos = (10 + d1 + d2) % 40;
      const passedMula = (10 + d1 + d2) >= 40;
      onMovePlayer(playerId, newPos, false);
      setResult({ newPos, passedMula });
      setPhase('result');
    } else {
      const nextAttempt = jailTurns + 1;
      if (nextAttempt >= 3) {
        // 3rd failed attempt — forced bail
        onTransfer(playerId, 'bank', BAIL);
        onMovePlayer(playerId, 10, false);
        setForcedBail(true);
        setPhase('normal_input');
      } else {
        onSetJailTurns(playerId, nextAttempt);
        setJailMsg(`Bukan double (${d1}+${d2}). Cubaan ke-${nextAttempt + 1}/3 pada giliran seterusnya.`);
        setD1(null); setD2(null);
      }
    }
  }

  function handleNormalMove() {
    if (total === null) return;
    const rawPos = currentPos + total;
    const passedMula = rawPos >= 40;
    const newPos = rawPos % 40;
    const sq = getSquare(newPos);
    const wasJailed = sq.type === 'go_to_jail';
    onMovePlayer(playerId, wasJailed ? 10 : newPos, wasJailed);
    setResult({ newPos: wasJailed ? 10 : newPos, passedMula });
    setPhase('result');
  }

  const sq = result !== null ? getSquare(result.newPos) : null;
  const propState = sq?.propertyId ? state.properties.find(p => p.propertyId === sq.propertyId) : null;
  const propDef = sq?.propertyId ? getProperty(sq.propertyId) : null;
  const owner = propState?.ownerId ? state.players.find(p => p.id === propState.ownerId) : null;
  const rent = sq?.propertyId && propState ? calculateRent(sq.propertyId, state) : 0;
  const isOwnProp = owner?.id === playerId;
  const isOthersProp = !!owner && !isOwnProp;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 bg-black/70 p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">🎲 Balingan Dadu</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {/* Player selector */}
        <div className="space-y-1">
          <label className="text-gray-400 text-xs uppercase tracking-wider">Pemain</label>
          <select
            value={playerId}
            onChange={e => resetForPlayer(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
          >
            {active.map(p => {
              const jail = state.inJail?.[p.id] ? ' 🔒' : '';
              return <option key={p.id} value={p.id}>{p.name} — Petak {state.positions?.[p.id] ?? 0}{jail}</option>;
            })}
          </select>
        </div>

        {/* ── JAIL OPTIONS ── */}
        {phase === 'jail_options' && (
          <div className="space-y-3">
            <div className="bg-red-900/30 border border-red-800 rounded-xl p-3 text-center space-y-1">
              <p className="text-red-400 font-black text-base">🔒 Dalam Penjara</p>
              <p className="text-gray-500 text-xs">Cubaan ke-{jailTurns + 1}/3</p>
            </div>
            <button
              onClick={handleBail}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl"
            >
              Bayar Bail RM{BAIL.toLocaleString()} + Gerak
            </button>
            <button
              onClick={() => setPhase('jail_try_double')}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl"
            >
              Cuba Double 🎲
            </button>
          </div>
        )}

        {/* ── JAIL TRY DOUBLE ── */}
        {phase === 'jail_try_double' && (
          <div className="space-y-3">
            <p className="text-gray-400 text-xs text-center">Masukkan nilai dadu — kena sama untuk bebas</p>
            <div className="grid grid-cols-2 gap-3">
              {[{ label: 'Dadu 1', val: d1, set: setD1 }, { label: 'Dadu 2', val: d2, set: setD2 }].map(({ label, val, set }) => (
                <div key={label} className="space-y-1.5">
                  <label className="text-gray-400 text-xs uppercase tracking-wider">{label}</label>
                  <div className="flex flex-wrap gap-1">
                    {DIE.map(n => (
                      <button key={n} onClick={() => set(n)}
                        className={`w-9 h-9 rounded-lg font-black text-sm transition-colors ${
                          val === n ? 'bg-amber-500 text-gray-950' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >{n}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {jailMsg && <p className="text-red-400 text-xs text-center">{jailMsg}</p>}
            {jailMsg ? (
              <button onClick={onClose} className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl">
                Tutup (masih dalam penjara)
              </button>
            ) : (
              <button
                onClick={handleDoubleCheck}
                disabled={d1 === null || d2 === null}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-950 font-black rounded-xl"
              >
                Semak Double
              </button>
            )}
            <button onClick={() => setPhase('jail_options')} className="w-full py-2 text-gray-600 hover:text-gray-400 text-sm">
              ← Kembali
            </button>
          </div>
        )}

        {/* ── NORMAL DICE INPUT ── */}
        {phase === 'normal_input' && (
          <div className="space-y-3">
            {(bailed || forcedBail) && (
              <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-2 text-center text-amber-400 text-xs font-semibold">
                {forcedBail ? '⚠ Dah 3 kali gagal — bail RM500 dibayar automatik' : '✓ Bail dibayar — boleh gerak sekarang'}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-gray-400 text-xs uppercase tracking-wider">Jumlah Dadu</label>
              <input
                type="number"
                value={total ?? ''}
                onChange={e => setTotal(e.target.value ? Number(e.target.value) : null)}
                placeholder="Masukkan jumlah..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-2xl font-black text-center focus:outline-none focus:border-amber-500"
                autoFocus
              />
            </div>
            <button
              onClick={handleNormalMove}
              disabled={total === null}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-950 font-black rounded-xl"
            >
              Gerak →
            </button>
          </div>
        )}

        {/* ── RESULT ── */}
        {phase === 'result' && sq && (
          <div className="space-y-3">
            <div className="bg-gray-800 rounded-xl p-4 text-center space-y-1">
              <div className="text-3xl">{squareEmoji(sq.type)}</div>
              <div className="text-white font-black text-lg">{sq.type === 'go_to_jail' ? 'Masuk Penjara!' : sq.name}</div>
              <div className="text-gray-500 text-xs">Petak {result!.newPos}</div>
              {propDef && (
                <div className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold mt-1"
                  style={{ backgroundColor: GROUP_COLOR_MAP[propDef.colorGroup].hex + '28', color: GROUP_COLOR_MAP[propDef.colorGroup].hex }}>
                  {GROUP_COLOR_MAP[propDef.colorGroup].label}
                </div>
              )}
            </div>

            {result!.passedMula && (
              <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 flex items-center justify-between">
                <span className="text-amber-400 font-bold text-sm">🏁 Lalu Mula!</span>
                <button onClick={() => onCollectStart(playerId)}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-sm rounded-xl">
                  +RM1,400
                </button>
              </div>
            )}

            {sq.type === 'tax' && (
              <button onClick={() => { onTransfer(playerId, 'bank', sq.amount!); onClose(); }}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl">
                Bayar {sq.name} — RM{sq.amount!.toLocaleString()}
              </button>
            )}
            {sq.type === 'denda' && (
              <button onClick={() => { onTransfer(playerId, 'bank', sq.amount!); onClose(); }}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl">
                Bayar Denda — RM{sq.amount!.toLocaleString()}
              </button>
            )}
            {sq.type === 'go_to_jail' && (
              <div className="bg-red-900/30 border border-red-800 rounded-xl p-3 text-center text-red-400 text-sm font-semibold">
                🚔 {player?.name} dihantar ke penjara (Petak 10)
              </div>
            )}
            {sq.type === 'jail' && (
              <div className="bg-gray-800 rounded-xl p-3 text-center text-gray-400 text-sm">Cuma melawat penjara ✓</div>
            )}
            {sq.type === 'mula' && (
              <div className="bg-gray-800 rounded-xl p-3 text-center text-gray-400 text-sm">Tepat di Mula ✓</div>
            )}
            {sq.type === 'chance' && (
              <div className="bg-gray-800 rounded-xl p-3 text-center space-y-1">
                <p className="text-amber-400 font-bold text-sm">❓ Kad Keputusan</p>
                <p className="text-gray-500 text-xs">Ambil kad dan buat tindakan secara manual</p>
              </div>
            )}
            {sq.type === 'property' && propDef && propState && (
              <>
                {!propState.ownerId && (
                  <button onClick={() => { onBuyProperty(playerId, sq.propertyId!); onClose(); }}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl">
                    Beli {sq.name} — RM{propDef.basePrice.toLocaleString()}
                  </button>
                )}
                {isOwnProp && <div className="bg-gray-800 rounded-xl p-3 text-center text-gray-400 text-sm">Tanah Sendiri ✓</div>}
                {isOthersProp && !propState.mortgaged && (
                  <div className="space-y-2">
                    <div className="bg-gray-800 rounded-xl p-3 flex justify-between text-sm">
                      <span className="text-gray-400">
                        Milik {owner!.name}{propState.hotel ? ' 🏨' : propState.houses > 0 ? ` 🏠×${propState.houses}` : ''}
                      </span>
                      <RM amount={rent} size="sm" />
                    </div>
                    <button onClick={() => { onPayRent(playerId, sq.propertyId!, rent); onClose(); }}
                      className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl">
                      Bayar Sewa — RM{rent.toLocaleString()}
                    </button>
                  </div>
                )}
                {isOthersProp && propState.mortgaged && (
                  <div className="bg-gray-800 rounded-xl p-3 text-center text-gray-400 text-sm">Tanah digadai — tiada sewa</div>
                )}
              </>
            )}

            <button onClick={onClose}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 font-semibold rounded-xl text-sm">
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
