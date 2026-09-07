import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../store/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    login,
    register,
    preservedPrompt,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(authModalMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMode(authModalMode);
    setErrorMessage(null);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMessage('Please enter your name.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
    }

    if (!email.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signin') {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password, confirmPassword);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150"
    >
      <div
        id="auth-modal-card"
        className="relative w-full max-w-[380px] max-h-[92vh] overflow-y-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-2xl"
      >
        {/* Close Button */}
        <button
          type="button"
          id="auth-modal-close-button"
          onClick={closeAuthModal}
          className="absolute right-3.5 top-3.5 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          title="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand Icon & Heading */}
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-900 shadow-sm flex-shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
              {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
            </h2>
          </div>
        </div>

        {/* Prompt preservation notice */}
        {preservedPrompt && (
          <div className="my-2.5 rounded-lg border border-indigo-200/80 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-indigo-950/30 p-2.5 text-[11px] text-indigo-700 dark:text-indigo-300">
            <span className="font-semibold">Prompt saved: </span>
            <span className="italic line-clamp-1">"{preservedPrompt}"</span>
            <div className="mt-0.5 text-[10px] text-indigo-600/80 dark:text-indigo-400">
              Will automatically send once signed in.
            </div>
          </div>
        )}

        {/* Mode Toggle Tabs */}
        <div className="mt-3 flex rounded-lg bg-zinc-100 dark:bg-zinc-800/60 p-0.5">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
              mode === 'signin'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
              mode === 'signup'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-2.5 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/40 p-2.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-2.5 space-y-2.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  id="auth-name-input"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 py-2 pl-9 pr-3 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1.5 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="email"
                id="auth-email-input"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 py-2 pl-9 pr-3 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1.5 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="password"
                id="auth-password-input"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 py-2 pl-9 pr-3 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1.5 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="password"
                  id="auth-confirm-password-input"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 py-2 pl-9 pr-3 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1.5 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            id="auth-submit-button"
            disabled={isLoading}
            className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 py-2.5 text-xs sm:text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-50 shadow-sm active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign In & Continue' : 'Create Account & Continue'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
