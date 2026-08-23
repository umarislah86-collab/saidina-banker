import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { subscribeToGame, subscribeToResults } from '../../services/sync';
import { PLAYER_COLOR_MAP, GROUP_COLOR_MAP } from '../../types';
import type { CoreGameState, GameResult } from '../../types';
import { getProperty } from '../../data/properties';
import { calculateNetWorth } from '../../game/netWorth';
import { loadGame } from '../../game/persistence';
import RM from '../../components/RM';

/* ─── helpers ─── */
function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}j ${m.toString().padStart(2, '0')}m`;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function formatStartTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
}

const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3',
  4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6',
};

function avatarPx(n: number): number {
  if (n <= 2) return 140;
  if (n <= 4) return 100;
  return 72;
}

/* ─── types ─── */
type FloatAnim = { id: string; playerId: string; amount: number; sign: 1 | -1 };

/* ─── CSS ─── */
const STYLES = `
@keyframes saidinaShimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes saidinaFloat {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-5px); }
}
.saidina-logo {
  background: linear-gradient(90deg,#dc2626 0%,#f97316 30%,#fbbf24 50%,#f97316 70%,#dc2626 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: saidinaShimmer 3s linear infinite, saidinaFloat 4s ease-in-out infinite;
  filter: drop-shadow(0 0 8px rgba(251,191,36,0.35));
}
@keyframes breatheGlow {
  0%, 100% { box-shadow: 0 0 10px 2px var(--gc); opacity: 1; }
  50%       { box-shadow: 0 0 32px 10px var(--gc); opacity: 1; }
}
.card-glow { animation: breatheGlow 2s ease-in-out infinite; }
@keyframes floatFade {
  0%   { opacity: 1; transform: translateY(0) scale(1); }
  15%  { opacity: 1; transform: translateY(-14px) scale(1.15); }
  100% { opacity: 0; transform: translateY(-90px) scale(0.85); }
}
.float-label { animation: floatFade 2.2s ease-out forwards; pointer-events: none; }
`;

/* ─── components ─── */
function SaidinaLogo() {
  return (
    <div>
      <div className="saidina-logo font-black text-4xl tracking-widest leading-none">$AIDINA</div>
      <div className="text-amber-600 text-xs font-semibold tracking-widest uppercase mt-0.5">Banker Companion</div>
    </div>
  );
}

function FloatLabel({ amount, sign }: { amount: number; sign: 1 | -1 }) {
  return (
    <div className="float-label absolute inset-0 flex items-center justify-center z-30">
      <span
        className="font-black drop-shadow-2xl"
        style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          color: sign > 0 ? '#4ade80' : '#f87171',
          textShadow: sign > 0 ? '0 0 20px #4ade80' : '0 0 20px #f87171',
        }}
      >
        {sign > 0 ? '+' : '-'}RM{amount.toLocaleString()}
      </span>
    </div>
  );
}

/* ─── main ─── */
export default function DisplayPage() {
  const [searchParams] = useSearchParams();
  const [gameState, setGameState] = useState<CoreGameState | null>(null);
  const [error, setError] = useState('');
  const [gameId, setGameId] = useState(searchParams.get('id') ?? '');
  const [inputId, setInputId] = useState('');
  const [now, setNow] = useState(Date.now());
  const [animations, setAnimations] = useState<FloatAnim[]>([]);
  const lastTxIdRef = useRef('');
  const [results, setResults] = useState<GameResult[]>([]);

  useEffect(() => {
    const unsub = subscribeToResults(r => setResults(r));
    return unsub;
  }, []);

  useEffect(() => {
    const local = loadGame();
    if (local) {
      const { snapshot: _s, ...core } = local;
      setGameState(core);
      if (!gameId) setGameId(local.gameId);
    }
  }, []);

  useEffect(() => {
    if (!gameId) return;
    const unsub = subscribeToGame(gameId, gs => setGameState(gs), err => setError('Gagal: ' + err.message));
    return unsub;
  }, [gameId]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!gameState?.transactions?.length) return;
    const latest = gameState.transactions[gameState.transactions.length - 1];
    if (latest.id === lastTxIdRef.current) return;
    lastTxIdRef.current = latest.id;
    if (!latest.amount || latest.amount <= 0) return;
    const fresh: FloatAnim[] = [];
    if (latest.toPlayerId) fresh.push({ id: latest.id + '+', playerId: latest.toPlayerId, amount: latest.amount, sign: 1 });
    if (latest.fromPlayerId) fresh.push({ id: latest.id + '-', playerId: latest.fromPlayerId, amount: latest.amount, sign: -1 });
    if (!fresh.length) return;
    setAnimations(prev => [...prev, ...fresh]);
    setTimeout(() => setAnimations(prev => prev.filter(a => !fresh.some(f => f.id === a.id))), 2400);
  }, [gameState?.transactions]);

  if (!gameId) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
        <style>{STYLES}</style>
        <div className="text-center space-y-5 max-w-sm w-full">
          <SaidinaLogo />
          <p className="text-gray-400">Masukkan Game ID dari peranti Banker</p>
          <input
            value={inputId}
            onChange={e => setInputId(e.target.value)}
            placeholder="Game ID..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-center font-mono focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={() => { if (inputId.trim()) setGameId(inputId.trim()); }}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black rounded-xl"
          >
            Sambung
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <style>{STYLES}</style>
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400">Menyambung...</p>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  const activePlayers = gameState.players.filter(p => !p.isBankrupt);
  const currentPlayer = gameState.players[gameState.currentTurnIndex];
  const rankedPlayers = [...activePlayers].sort(
    (a, b) =>
      calculateNetWorth(b.id, gameState as Parameters<typeof calculateNetWorth>[1]) -
      calculateNetWorth(a.id, gameState as Parameters<typeof calculateNetWorth>[1])
  );
  const bankruptPlayers = gameState.players.filter(p => p.isBankrupt);
  const elapsed = gameState.createdAt ? now - gameState.createdAt : 0;
  const avPx = avatarPx(rankedPlayers.length);
  const cols = GRID_COLS[Math.min(rankedPlayers.length, 6)] ?? 'grid-cols-6';

  return (
    <div className="h-screen flex flex-col bg-gray-950 p-4 gap-3 overflow-hidden">
      <style>{STYLES}</style>

      {/* Header */}
      <div className="flex items-start justify-between shrink-0">
        <SaidinaLogo />
        <div className="text-right">
          <div className="font-mono font-black text-amber-400" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
            {formatElapsed(elapsed)}
          </div>
          {gameState.createdAt && (
            <div className="text-gray-300 font-semibold" style={{ fontSize: 'clamp(0.85rem, 1.5vw, 1.1rem)' }}>
              Mula: {formatStartTime(gameState.createdAt)}
            </div>
          )}
          <div className="text-gray-500 text-xs">Giliran ke-{gameState.turnNumber}</div>
          <button
            onClick={() => { setGameId(''); setGameState(null); setError(''); }}
            className="text-gray-700 hover:text-gray-500 text-xs underline"
          >
            Tukar ID
          </button>
        </div>
      </div>

      {/* Player cards grid */}
      <div className={`flex-[3] min-h-0 grid ${cols} gap-3`}>
        {rankedPlayers.map((player, rank) => {
          const pColor = PLAYER_COLOR_MAP[player.color];
          const ownedProps = gameState.properties.filter(p => p.ownerId === player.id);
          const netWorth = calculateNetWorth(player.id, gameState as Parameters<typeof calculateNetWorth>[1]);
          const isCurrent = player.id === currentPlayer?.id;
          const playerAnims = animations.filter(a => a.playerId === player.id);

          const byGroup: Record<string, typeof ownedProps> = {};
          ownedProps.forEach(p => {
            const def = getProperty(p.propertyId);
            if (!byGroup[def.colorGroup]) byGroup[def.colorGroup] = [];
            byGroup[def.colorGroup].push(p);
          });

          return (
            <div
              key={player.id}
              className={`relative bg-gray-900 rounded-2xl flex flex-col border-2 overflow-hidden ${isCurrent ? 'card-glow' : ''}`}
              style={{
                borderColor: isCurrent ? pColor.hex : '#1f2937',
                ['--gc' as string]: pColor.hex + 'aa',
              }}
            >
              {/* Rank + Networth badge */}
              <div
                className="shrink-0 flex items-center justify-between px-3 py-2"
                style={{ backgroundColor: pColor.hex + '28' }}
              >
                <span className="font-black text-lg" style={{ color: pColor.hex }}>#{rank + 1}</span>
                <span className="font-black text-base text-white">RM{netWorth.toLocaleString()}</span>
              </div>

              {/* Avatar + Name + Cash */}
              <div className="shrink-0 flex flex-col items-center gap-1.5 pt-3 pb-2 px-2">
                {player.avatar ? (
                  <img
                    src={player.avatar}
                    alt={player.name}
                    style={{ width: avPx, height: avPx, outline: `3px solid ${pColor.hex}`, outlineOffset: 2 }}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div
                    style={{
                      width: avPx, height: avPx,
                      backgroundColor: pColor.hex + '33',
                      border: `3px solid ${pColor.hex}`,
                      color: pColor.hex,
                      fontSize: avPx * 0.38,
                    }}
                    className="rounded-full flex items-center justify-center font-black"
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <p className="text-white font-black text-center leading-tight" style={{ fontSize: 'clamp(0.85rem, 1.4vw, 1.1rem)' }}>
                  {player.name}
                </p>
                <RM amount={player.cash} size="md" />
              </div>

              {/* Properties — flex-1 fills remaining height */}
              <div className="flex-1 px-2 pb-2 overflow-y-auto">
                {Object.entries(byGroup).length > 0 ? (
                  <div className="space-y-1.5 pt-1 border-t border-gray-800">
                    {Object.entries(byGroup).map(([group, props]) => {
                      const gc = GROUP_COLOR_MAP[group as keyof typeof GROUP_COLOR_MAP];
                      return (
                        <div key={group} className="space-y-0.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: gc.hex }} />
                          <div className="flex flex-wrap gap-1">
                            {props.map(ps => {
                              const def = getProperty(ps.propertyId);
                              return (
                                <span
                                  key={ps.propertyId}
                                  className="text-xs px-2 py-0.5 rounded-md font-semibold"
                                  style={{ backgroundColor: gc.hex + '28', color: gc.hex, border: `1px solid ${gc.hex}44` }}
                                >
                                  {def.name}
                                  {ps.mortgaged && <span className="opacity-50"> M</span>}
                                  {ps.hotel && ' 🏨'}
                                  {!ps.hotel && ps.houses > 0 && ` 🏠×${ps.houses}`}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              {/* Transaction float animations */}
              {playerAnims.map(anim => (
                <FloatLabel key={anim.id} amount={anim.amount} sign={anim.sign} />
              ))}
            </div>
          );
        })}
      </div>

      {/* Hall of Fame */}
      <div className="flex-[2] min-h-0 flex flex-col border-t border-gray-800 pt-3 gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-amber-400 text-base">🏆</span>
          <span className="text-amber-400 font-black text-sm uppercase tracking-widest">Dewan Kegemilangan</span>
        </div>
        {results.length === 0 ? (
          <p className="text-gray-700 text-xs">Belum ada rekod. Tamatkan permainan untuk simpan.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 flex-1 min-h-0">
            {results.map((r, i) => {
              const winner = r.rankings[0];
              const date = new Date(r.finishedAt).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' });
              const dur = (() => {
                const s = Math.floor(r.duration / 1000);
                const h = Math.floor(s / 3600);
                const m = Math.floor((s % 3600) / 60);
                return h > 0 ? `${h}j ${m}m` : `${m}m`;
              })();
              return (
                <div key={r.gameId} className="flex-shrink-0 bg-gray-900 border border-gray-800 rounded-xl p-3 flex flex-col items-center gap-1.5 min-w-[110px]">
                  <span className="text-gray-600 text-xs">#{i + 1}</span>
                  {winner?.avatar ? (
                    <img src={winner.avatar} className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-500" alt="" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center font-black text-amber-400 text-lg">
                      {winner?.name.charAt(0) ?? '?'}
                    </div>
                  )}
                  <p className="text-white font-black text-sm text-center truncate w-full">{winner?.name ?? '—'}</p>
                  <div className="flex flex-wrap justify-center gap-1">
                    {r.rankings.slice(1, 4).map((p, ri) => (
                      <span key={ri} className="text-gray-500 text-xs">{['🥈','🥉','4️⃣'][ri]} {p.name}</span>
                    ))}
                  </div>
                  <div className="text-gray-600 text-xs text-center">{date} · {dur}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-between">
        {bankruptPlayers.length > 0 ? (
          <div className="flex gap-2 text-gray-600 text-xs">
            <span>Muflis:</span>
            {bankruptPlayers.map(p => <span key={p.id}>{p.name}</span>)}
          </div>
        ) : <div />}
        <p className="text-gray-800 text-xs font-mono">{gameState.gameId}</p>
      </div>
    </div>
  );
}
