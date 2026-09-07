import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '🤓', '😎', '🤩', '🥳', '😏', '🤔', '🤫', '🤭', '🥱'],
  },
  {
    name: 'Gestures',
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '✋', '🤚', '👋', '🤝', '👏', '🙌', '👐', '🤲', '🙏', '💪', '🧠', '👀'],
  },
  {
    name: 'Tech & Work',
    emojis: ['💻', '🖥️', '⌨️', '🖱️', '📱', '🔋', '🔌', '💡', '🔦', '🔬', '🔭', '📡', '⚙️', '🔧', '🔨', '📊', '📈', '📉', '📁', '📂', '📄', '📝', '📅', '📆'],
  },
  {
    name: 'Symbols & Sparks',
    emojis: ['✨', '⭐', '🌟', '💫', '⚡', '🔥', '💥', '🚀', '🎯', '🏆', '🎉', '🎊', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💯', '✅', '❌', '⚠️'],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      id="emoji-picker-container"
      className="absolute bottom-16 left-0 z-50 w-72 sm:w-80 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-xl backdrop-blur-md"
    >
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
        <input
          type="text"
          id="emoji-search-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search emojis..."
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 py-1.5 pl-8 pr-3 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
        />
      </div>

      <div className="max-h-56 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {EMOJI_CATEGORIES.map(cat => {
          const filtered = cat.emojis.filter(e => !search || e.includes(search));
          if (filtered.length === 0) return null;
          return (
            <div key={cat.name}>
              <div className="mb-1 text-[11px] font-medium tracking-wide text-zinc-400 dark:text-zinc-500 uppercase">
                {cat.name}
              </div>
              <div className="grid grid-cols-6 gap-1">
                {filtered.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onSelect(emoji);
                      onClose();
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
