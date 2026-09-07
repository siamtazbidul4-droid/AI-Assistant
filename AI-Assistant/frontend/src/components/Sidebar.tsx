import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  MessageSquare,
  MoreVertical,
  Trash2,
  Edit2,
  LogOut,
  Sun,
  Moon,
  Sparkles,
  X,
  User as UserIcon,
  Shield,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { Conversation } from '../types';
import { GroupedConversations } from '../hooks/useChat';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../store/ThemeContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  groupedConversations: GroupedConversations;
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onOpenRename: (conv: Conversation) => void;
  onOpenDelete: (conv: Conversation) => void;
  onOpenInfo: (section: 'about' | 'privacy' | 'terms') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  groupedConversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onOpenRename,
  onOpenDelete,
  onOpenInfo,
}) => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderGroup = (title: string, list: Conversation[]) => {
    if (list.length === 0) return null;

    return (
      <div className="mb-4">
        <h3 className="px-3 mb-1.5 text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
          {title}
        </h3>
        <div className="space-y-0.5">
          {list.map(conv => {
            const isSelected = conv._id === currentConversationId;
            const isMenuOpen = activeMenuId === conv._id;

            return (
              <div
                key={conv._id}
                className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectConversation(conv._id);
                    onClose();
                  }}
                  className="flex flex-1 items-center gap-2.5 truncate text-left focus:outline-none"
                >
                  <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
                  <span className="truncate">{conv.title}</span>
                </button>

                {/* Three-dot options menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setActiveMenuId(isMenuOpen ? null : conv._id);
                    }}
                    className={`rounded-md p-1 transition-opacity ${
                      isSelected || isMenuOpen
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>

                  {isMenuOpen && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-6 z-50 w-32 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 shadow-xl animate-in fade-in duration-100"
                    >
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setActiveMenuId(null);
                          onOpenRename(conv);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Edit2 className="h-3 w-3" />
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setActiveMenuId(null);
                          onOpenDelete(conv);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const hasHistory =
    groupedConversations.today.length > 0 ||
    groupedConversations.yesterday.length > 0 ||
    groupedConversations.last7Days.length > 0 ||
    groupedConversations.older.length > 0;

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/95 dark:bg-zinc-950/95 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-900 shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                AI Assistant Siam
              </h1>
              <p className="text-[10px] text-zinc-400"> Text & Live Voice</p>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            type="button"
            id="sidebar-new-chat-button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-2.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shadow-xs active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
          {!isAuthenticated ? (
            <div className="px-4 py-8 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-2" />
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Sign in to save chat history
              </p>
              <button
                type="button"
                onClick={() => openAuthModal('signin')}
                className="mt-3 inline-block text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
              >
                Sign In or Register →
              </button>
            </div>
          ) : !hasHistory ? (
            <div className="px-4 py-8 text-center text-xs text-zinc-400">
              No conversations yet. Start a new chat above!
            </div>
          ) : (
            <>
              {renderGroup('Today', groupedConversations.today)}
              {renderGroup('Yesterday', groupedConversations.yesterday)}
              {renderGroup('Previous 7 Days', groupedConversations.last7Days)}
              {renderGroup('Older', groupedConversations.older)}
            </>
          )}
        </div>

        {/* Public info links */}
        <div className="flex items-center justify-around px-3 py-2 text-[11px] text-zinc-400 border-t border-zinc-200/50 dark:border-zinc-800/50">
          <button
            type="button"
            onClick={() => onOpenInfo('about')}
            className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            About
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onOpenInfo('privacy')}
            className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            Privacy
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onOpenInfo('terms')}
            className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            Terms
          </button>
        </div>

        {/* Bottom User Profile / Settings */}
        <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2.5 truncate">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('signin')}
                className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
              >
                <UserIcon className="h-4 w-4" />
                <span>Sign In / Register</span>
              </button>
            )}

            <div className="flex items-center gap-1">
              {/* Theme toggle */}
              <button
                type="button"
                id="theme-toggle-button"
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-zinc-600" />
                )}
              </button>

              {/* Logout button if authenticated */}
              {isAuthenticated && (
                <button
                  type="button"
                  id="logout-button"
                  onClick={logout}
                  title="Sign Out"
                  className="rounded-lg p-2 text-zinc-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
