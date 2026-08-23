
interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title, message, confirmLabel = 'Sahkan', cancelLabel = 'Batal',
  danger = false, onConfirm, onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-700 p-6 space-y-4">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-gray-300 text-sm">{message}</p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 font-medium hover:bg-gray-800 active:bg-gray-700 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
              danger
                ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white'
                : 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-gray-950'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
