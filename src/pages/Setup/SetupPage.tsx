import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SetupPlayerDraft, PlayerColor, GameConfig } from '../../types';
import { PLAYER_COLOR_MAP } from '../../types';
import { MIN_PLAYERS, MAX_PLAYERS } from '../../data/gameConfig';
import { useGameState } from '../../hooks/useGameState';
import AvatarCaptureModal from '../../components/AvatarCaptureModal';

const COLORS: PlayerColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];

function makeId() { return Math.random().toString(36).slice(2, 10); }

function defaultPlayers(count: number): SetupPlayerDraft[] {
  return Array.from({ length: count }, (_, i) => ({
    id: makeId(),
    name: `Pemain ${i + 1}`,
    color: COLORS[i],
  }));
}

export default function SetupPage() {
  const navigate = useNavigate();
  const { startGame } = useGameState();
  const [step, setStep] = useState<1 | 2>(1);
  const [playerCount, setPlayerCount] = useState(2);
  const [diceMode, setDiceMode] = useState<'physical' | 'digital'>('physical');
  const [startingCash, setStartingCash] = useState(10000);
  const [players, setPlayers] = useState<SetupPlayerDraft[]>(defaultPlayers(2));
  const [errors, setErrors] = useState<string[]>([]);
  const [avatarTarget, setAvatarTarget] = useState<{ idx: number; name: string } | null>(null);

  function handleCountChange(count: number) {
    setPlayerCount(count);
    setPlayers(prev => {
      if (count > prev.length) {
        const extras = Array.from({ length: count - prev.length }, (_, i) => ({
          id: makeId(),
          name: `Pemain ${prev.length + i + 1}`,
          color: COLORS[prev.length + i] ?? COLORS[0],
        }));
        return [...prev, ...extras];
      }
      return prev.slice(0, count);
    });
  }

  function updatePlayer(idx: number, changes: Partial<SetupPlayerDraft>) {
    setPlayers(prev => prev.map((p, i) => i === idx ? { ...p, ...changes } : p));
  }

  function validate(): boolean {
    const errs: string[] = [];
    const names = players.map(p => p.name.trim());
    if (names.some(n => n === '')) errs.push('Semua pemain kena ada nama');
    if (new Set(names).size !== names.length) errs.push('Nama pemain tak boleh sama');
    const colors = players.map(p => p.color);
    if (new Set(colors).size !== colors.length) errs.push('Warna pemain tak boleh sama');
    setErrors(errs);
    return errs.length === 0;
  }

  function handleStart() {
    if (!validate()) return;
    const config: Partial<GameConfig> = { diceMode, startingCash };
    startGame(players.slice(0, playerCount), config);
    navigate('/banker');
  }

  const usedColors = new Set(players.map(p => p.color));

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-4xl font-black tracking-tight text-white">SAIDINA</div>
          <div className="text-amber-400 font-semibold tracking-widest text-sm uppercase">Banker Companion</div>
        </div>

        {step === 1 && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-6">
            <div className="space-y-3">
              <label className="text-gray-300 font-semibold text-sm uppercase tracking-wider">Bilangan Pemain</label>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => i + MIN_PLAYERS).map(n => (
                  <button
                    key={n}
                    onClick={() => handleCountChange(n)}
                    className={`py-3 rounded-xl font-bold text-lg transition-colors ${
                      playerCount === n ? 'bg-amber-500 text-gray-950' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-gray-300 font-semibold text-sm uppercase tracking-wider">Wang Mula</label>
              <div className="grid grid-cols-3 gap-2">
                {[8000, 10000, 15000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setStartingCash(amt)}
                    className={`py-3 rounded-xl font-semibold text-sm transition-colors ${
                      startingCash === amt ? 'bg-amber-500 text-gray-950' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    RM{(amt / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">RM</span>
                <input
                  type="number"
                  value={startingCash}
                  onChange={e => setStartingCash(Math.max(1000, parseInt(e.target.value) || 10000))}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                  placeholder="Wang permulaan"
                  step={500}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-gray-300 font-semibold text-sm uppercase tracking-wider">Mod Dadu</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDiceMode('physical')}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${
                    diceMode === 'physical' ? 'border-amber-500 bg-amber-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-1">🎲</div>
                  <div className="font-bold text-white text-sm">Dadu Fizikal</div>
                  <div className="text-gray-400 text-xs mt-1">Guna dadu sebenar. App jadi Jurubank sahaja.</div>
                  {diceMode === 'physical' && <div className="text-amber-400 text-xs mt-1 font-semibold">✓ Disyorkan</div>}
                </button>
                <button
                  onClick={() => setDiceMode('digital')}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${
                    diceMode === 'digital' ? 'border-amber-500 bg-amber-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-1">📱</div>
                  <div className="font-bold text-white text-sm">Dadu Digital</div>
                  <div className="text-gray-400 text-xs mt-1">App baling dadu dan jejak posisi papan.</div>
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-gray-950 font-black rounded-xl text-lg transition-colors"
            >
              Seterusnya →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white p-1">←</button>
              <h2 className="font-bold text-white text-lg">Setup Pemain</h2>
            </div>

            {errors.length > 0 && (
              <div className="bg-red-900/50 border border-red-700 rounded-xl p-3 space-y-1">
                {errors.map(e => <p key={e} className="text-red-300 text-sm">{e}</p>)}
              </div>
            )}

            <div className="space-y-4">
              {players.slice(0, playerCount).map((player, idx) => (
                <div key={player.id} className="bg-gray-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar button */}
                    <button
                      onClick={() => setAvatarTarget({ idx, name: player.name || `Pemain ${idx + 1}` })}
                      className="flex-shrink-0 relative"
                      title="Ambil gambar"
                    >
                      {player.avatar ? (
                        <img src={player.avatar} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-500" />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-dashed border-gray-600 hover:border-amber-500 transition-colors"
                          style={{ backgroundColor: PLAYER_COLOR_MAP[player.color].hex + '22' }}
                        >
                          <span className="text-lg">📷</span>
                        </div>
                      )}
                      {player.avatar && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-xs">✎</div>
                      )}
                    </button>

                    <span className="text-gray-500 text-sm font-mono">#{idx + 1}</span>
                    <input
                      type="text"
                      value={player.name}
                      onChange={e => updatePlayer(idx, { name: e.target.value })}
                      maxLength={20}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                      placeholder={`Nama Pemain ${idx + 1}`}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map(color => {
                      const isUsed = usedColors.has(color) && player.color !== color;
                      const { hex } = PLAYER_COLOR_MAP[color];
                      return (
                        <button
                          key={color}
                          disabled={isUsed}
                          onClick={() => updatePlayer(idx, { color })}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            player.color === color ? 'border-white scale-110' : isUsed ? 'border-gray-700 opacity-30' : 'border-transparent hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleStart}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-gray-950 font-black rounded-xl text-lg transition-colors"
            >
              Mula Permainan
            </button>
          </div>
        )}

        <p className="text-center text-gray-600 text-xs">
          Display screen: <span className="text-gray-500 font-mono">/display</span>
        </p>
      </div>

      {avatarTarget && (
        <AvatarCaptureModal
          playerId={String(avatarTarget.idx)}
          playerName={avatarTarget.name}
          onCapture={dataUrl => updatePlayer(avatarTarget.idx, { avatar: dataUrl })}
          onClose={() => setAvatarTarget(null)}
        />
      )}
    </div>
  );
}
