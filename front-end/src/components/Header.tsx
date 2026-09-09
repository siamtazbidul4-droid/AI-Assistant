import React from 'react';
import { Menu, Plus, Mic, Sparkles, User as UserIcon } from 'lucide-react';
import { useAuth } from '../store/AuthContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onOpenVoice: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onNewChat,
  onOpenVoice,
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <button
          type="button"
          id="mobile-menu-button"
          onClick={onToggleSidebar}
          className="rounded-xl p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors md:hidden"
          title="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onNewChat}
          className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* Center Brand Title */}
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs font-bold tracking-tight text-zinc-800 dark:text-zinc-200">
          AI Assistant
        </span>
        <span className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/60 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
          বাংলা / EN
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Live Voice Shortcut Button */}
        <button
          type="button"
          id="header-voice-button"
          onClick={onOpenVoice}
          title="Open Gemini Live Voice"
          className="flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-50 dark:bg-sky-950/40 px-3 py-1 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
        >
          <Mic className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Live Voice</span>
        </button>

        {/* User Auth state */}
        {isAuthenticated && user ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
            {user.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal('signin')}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
