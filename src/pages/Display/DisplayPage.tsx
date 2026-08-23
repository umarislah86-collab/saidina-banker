import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { subscribeToGame } from '../../services/sync';
import { PLAYER_COLOR_MAP, GROUP_COLOR_MAP } from '../../types';
import type { CoreGameState } from '../../types';
import { getProperty } from '../../data/properties';
import { calculateNetWorth } from '../../game/netWorth';
import { loadGame } from '../../game/persistence';
import RM from '../../components/RM';

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}j ${m.toString().padStart(2, '0')}m ${sec.toString().padStart(2, '0')}s`;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function formatStartTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });
}

function gridClass(n: number): string {
  if (n === 1) return 'flex justify-center';
  if (n === 2) return 'grid grid-cols-2 max-w-2xl mx-auto';
  if (n === 3) return 'grid grid-cols-3 max-w-4xl mx-auto';
  if (n === 4) return 'grid grid-cols-4 max-w-5xl mx-auto';
  if (n === 5) return 'grid grid-cols-5';
  return 'grid grid-cols-6';
}

export default function DisplayPage() {
  const [searchParams] = useSearchParams();
  const [gameState, setGameState] = useState<CoreGameState | null>(null);
  const [error, setError] = useState('');
  const [gameId, setGameId] = useState(searchParams.get('id') ?? '');
  const [inputId, setInputId] = useState('');
  const [now, setNow] = useState(Date.now());

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
    const unsub = subscribeToGame(
      gameId,
      gs => setGameState(gs),
      err => setError('Gagal sambung: ' + err.message)
    );
    return unsub;
  }, [gameId]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!gameId) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-sm w-full">
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

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col p-4 gap-5">
      {/* Logo + Header */}
      <div className="flex items-center justify-between">
        <SaidinaLogo />
        <div className="text-right space-y-0.5">
          <p className="text-gray-500 text-xs">Giliran ke-{gameState.turnNumber}</p>
          <p className="text-gray-500 text-xs">
            Mula: {gameState.createdAt ? formatStartTime(gameState.createdAt) : '—'}
          </p>
          <p className="text-amber-400 font-mono text-sm font-bold">{formatElapsed(elapsed)}</p>
          <button
            onClick={() => { setGameId(''); setGameState(null); setError(''); }}
            className="text-gray-700 hover:text-gray-500 text-xs underline"
          >
            Tukar ID
          </button>
        </div>
      </div>

      {/* Current Turn Banner */}
      <div
        className="rounded-xl px-4 py-2 flex items-center gap-3 border"
        style={{
          backgroundColor: PLAYER_COLOR_MAP[currentPlayer?.color ?? 'red'].hex + '18',
          borderColor: PLAYER_COLOR_MAP[currentPlayer?.color ?? 'red'].hex + '55',
        }}
      >
        {currentPlayer?.avatar ? (
          <img src={currentPlayer.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm" style={{ backgroundColor: PLAYER_COLOR_MAP[currentPlayer?.color ?? 'red'].hex }}>
            {currentPlayer?.name.charAt(0)}
          </div>
        )}
        <div>
          <span className="text-xs text-gray-400 uppercase tracking-widest">Giliran Sekarang</span>
          <p className="text-white font-black text-lg leading-none">{currentPlayer?.name}</p>
        </div>
      </div>

      {/* Player Cards */}
      <div className={`${gridClass(rankedPlayers.length)} gap-3 w-full`}>
        {rankedPlayers.map((player, rank) => {
          const pColor = PLAYER_COLOR_MAP[player.color];
          const ownedProps = gameState.properties.filter(p => p.ownerId === player.id);
          const netWorth = calculateNetWorth(player.id, gameState as Parameters<typeof calculateNetWorth>[1]);
          const isCurrent = player.id === currentPlayer?.id;

          const byGroup: Record<string, typeof ownedProps> = {};
          ownedProps.forEach(p => {
            const def = getProperty(p.propertyId);
            if (!byGroup[def.colorGroup]) byGroup[def.colorGroup] = [];
            byGroup[def.colorGroup].push(p);
          });

          return (
            <div
              key={player.id}
              className={`bg-gray-900 rounded-2xl flex flex-col border-2 overflow-hidden transition-all ${
                isCurrent ? 'border-amber-400 shadow-lg shadow-amber-400/20' : 'border-gray-800'
              }`}
            >
              {/* Rank badge */}
              <div
                className="px-3 py-1.5 flex items-center justify-between"
                style={{ backgroundColor: pColor.hex + '22' }}
              >
                <span className="text-xs font-black tracking-widest uppercase" style={{ color: pColor.hex }}>
                  #{rank + 1}
                </span>
                {isCurrent && (
                  <span className="text-amber-400 text-xs font-bold animate-pulse">▶ SEKARANG</span>
                )}
              </div>

              <div className="p-3 flex flex-col items-center gap-2 flex-1">
                {/* Big avatar */}
                <div className="relative">
                  {player.avatar ? (
                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-20 h-20 rounded-full object-cover"
                      style={{ outline: `3px solid ${pColor.hex}`, outlineOffset: '2px' }}
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center font-black text-3xl"
                      style={{
                        backgroundColor: pColor.hex + '33',
                        border: `3px solid ${pColor.hex}`,
                        color: pColor.hex,
                      }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name */}
                <p className="text-white font-black text-base text-center leading-tight">{player.name}</p>

                {/* Cash + networth */}
                <div className="w-full space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs">Tunai</span>
                    <RM amount={player.cash} size="sm" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs">Nilai Bersih</span>
                    <span className="text-gray-300 font-bold text-sm">RM{netWorth.toLocaleString()}</span>
                  </div>
                </div>

                {/* Properties */}
                {Object.entries(byGroup).length > 0 && (
                  <div className="w-full border-t border-gray-800 pt-2 space-y-1.5">
                    {Object.entries(byGroup).map(([group, props]) => {
                      const gc = GROUP_COLOR_MAP[group as keyof typeof GROUP_COLOR_MAP];
                      return (
                        <div key={group} className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: gc.hex }} />
                          </div>
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
                )}

                {ownedProps.length === 0 && (
                  <p className="text-gray-700 text-xs">Tiada hartanah</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bankrupt */}
      {bankruptPlayers.length > 0 && (
        <div className="flex gap-3 items-center text-gray-600 text-sm">
          <span>Muflis:</span>
          {bankruptPlayers.map(p => (
            <span key={p.id} className="text-gray-500">{p.name}</span>
          ))}
        </div>
      )}

      <div className="text-center">
        <p className="text-gray-800 text-xs font-mono">{gameState.gameId}</p>
      </div>
    </div>
  );
}

function SaidinaLogo() {
  return (
    <>
      <style>{`
        @keyframes saidinaShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes saidinaFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
        .saidina-logo {
          background: linear-gradient(90deg, #dc2626 0%, #f97316 30%, #fbbf24 50%, #f97316 70%, #dc2626 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: saidinaShimmer 3s linear infinite, saidinaFloat 4s ease-in-out infinite;
          filter: drop-shadow(0 0 8px rgba(251,191,36,0.4));
        }
      `}</style>
      <div>
        <div className="saidina-logo font-black text-3xl tracking-widest leading-none">$AIDINA</div>
        <div className="text-amber-600 text-xs font-semibold tracking-widest uppercase mt-0.5">Banker Companion</div>
      </div>
    </>
  );
}
