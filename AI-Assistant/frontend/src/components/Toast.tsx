import React from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-4 py-3 text-xs font-medium shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
      {type === 'success' && <Check className="h-4 w-4 text-emerald-500" />}
      {type === 'error' && <AlertCircle className="h-4 w-4 text-rose-500" />}
      {type === 'info' && <Info className="h-4 w-4 text-sky-500" />}
      <span className="text-zinc-800 dark:text-zinc-200">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 rounded-md p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};
