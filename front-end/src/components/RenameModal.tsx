import React, { useState, useEffect } from 'react';
import { Edit2, Loader2 } from 'lucide-react';

interface RenameModalProps {
  isOpen: boolean;
  initialTitle: string;
  isRenaming: boolean;
  onConfirm: (newTitle: string) => void;
  onCancel: () => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  initialTitle,
  isRenaming,
  onConfirm,
  onCancel,
}) => {
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onConfirm(title.trim());
    }
  };

  return (
    <div
      id="rename-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div
        id="rename-modal-card"
        className="w-full max-w-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 mb-4">
          <Edit2 className="h-5 w-5" />
        </div>

        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Rename conversation
        </h3>

        <form onSubmit={handleSubmit} className="mt-4">
          <input
            type="text"
            id="rename-conversation-input"
            required
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
          />

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              id="rename-modal-cancel-button"
              onClick={onCancel}
              disabled={isRenaming}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="rename-modal-save-button"
              disabled={isRenaming || !title.trim()}
              className="flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm disabled:opacity-50"
            >
              {isRenaming && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
