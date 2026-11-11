import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface NotificationToastProps {
  type: 'success' | 'error' | null;
  message: string;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  type,
  message,
  onClose,
}) => {
  useEffect(() => {
    if (!type) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [type, message, onClose]);

  if (!type || !message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-200">
      <div
        className={`p-4 rounded-xl shadow-xl border flex items-start gap-3 ${
          type === 'success'
            ? 'bg-white border-emerald-200 text-neutral-800'
            : 'bg-white border-rose-200 text-neutral-800'
        }`}
      >
        {type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        )}

        <div className="flex-1 text-xs">
          <p className="font-bold text-neutral-900">
            {type === 'success' ? 'Operación Exitosa' : 'Atención / Validación'}
          </p>
          <p className="mt-0.5 text-neutral-600 leading-relaxed">{message}</p>
        </div>

        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-600 p-1 rounded-md transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
