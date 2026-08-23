import { useState, useRef, useEffect } from 'react';

interface Props {
  playerId: string;
  playerName: string;
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

export default function AvatarCaptureModal({ playerName, onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(s => {
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setError('Kamera tidak dapat diakses'));
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = 240;
    canvas.height = 240;
    const ctx = canvas.getContext('2d')!;
    // Centre-crop square
    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 240, 240);
    setPreview(canvas.toDataURL('image/jpeg', 0.7));
  }

  function confirm() {
    if (!preview) return;
    stream?.getTracks().forEach(t => t.stop());
    onCapture(preview);
    onClose();
  }

  function retake() {
    setPreview(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 bg-black/80 p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Avatar — {playerName}</h3>
          <button onClick={() => { stream?.getTracks().forEach(t => t.stop()); onClose(); }} className="text-gray-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {error ? (
          <p className="text-red-400 text-sm">{error}</p>
        ) : preview ? (
          <div className="space-y-3">
            <img src={preview} alt="preview" className="w-full aspect-square object-cover rounded-xl" />
            <div className="flex gap-2">
              <button onClick={retake} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl">
                Ambil Semula
              </button>
              <button onClick={confirm} className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black rounded-xl">
                Guna Foto
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-square object-cover rounded-xl bg-gray-800"
            />
            <button onClick={capture} className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black rounded-xl text-lg">
              📸 Ambil Foto
            </button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
