import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { subscribeToGame } from '../../services/sync';
import { PLAYER_COLOR_MAP, GROUP_COLOR_MAP } from '../../types';
import type { CoreGameState } from '../../types';
import { getProperty } from '../../data/properties';
import { calculateNetWorth } from '../../game/netWorth';
import { loadGame } from '../../game/persistence';
import RM from '../../components/RM';

export default function DisplayPage() {
  const [searchParams] = useSearchParams();
  const [gameState, setGameState] = useState<CoreGameState | null>(null);
  const [error, setError] = useState('');
  const [gameId, setGameId] = useState(searchParams.get('id') ?? '');
  const [inputId, setInputId] = useState('');

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
      (gs) => setGameState(gs),
      (err) => setError('Gagal sambung: ' + err.message)
    );
    return unsub;
  }, [gameId]);

  if (!gameId) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-sm w-full">
          <h1 className="text-white font-black text-3xl">Saidina</h1>
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
    (a, b) => calculateNetWorth(b.id, gameState as Parameters<typeof calculateNetWorth>[1]) - calculateNetWorth(a.id, gameState as Parameters<typeof calculateNetWorth>[1])
  );

  return (
    <div className="min-h-screen bg-gray-950 p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-black text-4xl">Saidina</h1>
          <p className="text-gray-500 text-lg">Giliran ke-{gameState.turnNumber}</p>
          <button
            onClick={() => { setGameId(''); setGameState(null); setError(''); }}
            className="mt-1 text-gray-600 hover:text-gray-400 text-xs underline"
          >
            Tukar Game ID
          </button>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-sm">Giliran</p>
          <p className="text-white font-black text-2xl">{currentPlayer?.name}</p>
          <div
            className="inline-block px-3 py-0.5 rounded-full text-sm font-bold mt-1"
            style={{
              backgroundColor: PLAYER_COLOR_MAP[currentPlayer?.color ?? 'red'].hex + '33',
              color: PLAYER_COLOR_MAP[currentPlayer?.color ?? 'red'].hex,
            }}
          >
            ▶ SEKARANG
          </div>
        </div>
      </div>

      {/* Player Cards Grid */}
      <div className={`grid gap-4 ${activePlayers.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}>
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
              className={`bg-gray-900 rounded-2xl p-5 border-2 ${isCurrent ? 'border-amber-400 shadow-lg shadow-amber-400/20' : 'border-gray-800'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 text-2xl font-black">#{rank + 1}</span>
                  {player.avatar ? (
                    <img src={player.avatar} alt={player.name} className="w-12 h-12 rounded-full object-cover" style={{ outline: `2px solid ${pColor.hex}` }} />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg" style={{ backgroundColor: pColor.hex + '44', border: `2px solid ${pColor.hex}` }}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-black text-xl">{player.name}</p>
                    {isCurrent && <p className="text-amber-400 text-xs font-bold">GILIRAN SEKARANG</p>}
                  </div>
                </div>
              </div>

              <div className="mb-4 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Wang Tunai</span>
                  <RM amount={player.cash} size="lg" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Nilai Bersih</span>
                  <span className="text-gray-300 font-bold text-lg">RM{netWorth.toLocaleString()}</span>
                </div>
              </div>

              {Object.entries(byGroup).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(byGroup).map(([group, props]) => {
                    const gc = GROUP_COLOR_MAP[group as keyof typeof GROUP_COLOR_MAP];
                    return (
                      <div key={group} className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: gc.hex }} />
                          <span className="text-xs text-gray-500 uppercase tracking-wider">{group}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pl-4">
                          {props.map(ps => {
                            const def = getProperty(ps.propertyId);
                            return (
                              <span
                                key={ps.propertyId}
                                className="px-2.5 py-1 rounded-lg text-sm font-bold tracking-wide"
                                style={{ backgroundColor: gc.hex + '30', color: gc.hex, border: `1px solid ${gc.hex}55` }}
                              >
                                {def.name}
                                {ps.mortgaged && <span className="opacity-60 text-xs"> [M]</span>}
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
              ) : (
                <p className="text-gray-700 text-sm">Tiada hartanah</p>
              )}
            </div>
          );
        })}
      </div>

      {gameState.players.filter(p => p.isBankrupt).length > 0 && (
        <div className="flex gap-4 text-gray-600 text-sm">
          <span>Muflis:</span>
          {gameState.players.filter(p => p.isBankrupt).map(p => (
            <span key={p.id}>{p.name}</span>
          ))}
        </div>
      )}

      <div className="text-center">
        <p className="text-gray-700 text-xs font-mono">{gameState.gameId}</p>
      </div>
    </div>
  );
}
