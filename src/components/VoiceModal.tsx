import React, { useEffect } from 'react';
import { Mic, MicOff, PhoneOff, AlertCircle, Sparkles } from 'lucide-react';
import { VoiceState } from '../types';

interface VoiceModalProps {
  isOpen: boolean;
  state: VoiceState;
  audioLevel: number;
  errorMessage: string | null;
  onClose: () => void;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  state,
  audioLevel,
  errorMessage,
  onClose,
}) => {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getStatusText = () => {
    switch (state) {
      case 'connecting':
        return 'Connecting to Gemini Live...';
      case 'listening':
        return 'Listening to your voice...';
      case 'thinking':
        return 'Processing...';
      case 'speaking':
        return 'AI is speaking...';
      case 'interrupted':
        return 'Interrupted, listening to you...';
      case 'error':
        return errorMessage || 'Voice connection issue';
      default:
        return 'Voice ready';
    }
  };

  const getStatusColor = () => {
    switch (state) {
      case 'listening':
        return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10';
      case 'speaking':
        return 'text-sky-500 border-sky-500/20 bg-sky-500/10';
      case 'interrupted':
        return 'text-amber-500 border-amber-500/20 bg-amber-500/10';
      case 'error':
        return 'text-rose-500 border-rose-500/20 bg-rose-500/10';
      default:
        return 'text-zinc-400 border-zinc-500/20 bg-zinc-500/10';
    }
  };

  return (
    <div
      id="voice-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div
        id="voice-modal-card"
        className="relative flex flex-col items-center w-full max-w-md rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-8 shadow-2xl backdrop-blur-xl"
      >
        {/* Header pill */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 text-xs font-medium text-zinc-600 dark:text-zinc-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            Gemini Live Real-Time Audio
          </div>
        </div>

        {/* Central visualizer */}
        <div className="relative flex items-center justify-center w-48 h-48 my-4">
          {/* Animated pulse rings reacting to mic audioLevel */}
          <div
            className="absolute rounded-full border border-sky-500/30 transition-all duration-75"
            style={{
              width: `${100 + audioLevel * 80}%`,
              height: `${100 + audioLevel * 80}%`,
              opacity: state === 'listening' ? 0.4 + audioLevel * 0.6 : 0.1,
            }}
          />
          <div
            className="absolute rounded-full bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 blur-xl transition-all duration-100"
            style={{
              width: `${90 + audioLevel * 70}%`,
              height: `${90 + audioLevel * 70}%`,
              opacity: state === 'speaking' || state === 'listening' ? 0.6 + audioLevel * 0.4 : 0.2,
            }}
          />

          {/* Central orb */}
          <div
            className={`flex items-center justify-center w-28 h-28 rounded-full border transition-all duration-200 shadow-xl ${
              state === 'speaking'
                ? 'border-sky-400/50 bg-sky-500/20 text-sky-400 scale-105'
                : state === 'listening'
                ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-400'
                : state === 'error'
                ? 'border-rose-400/50 bg-rose-500/20 text-rose-400'
                : 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
            }`}
          >
            {state === 'error' ? (
              <AlertCircle className="h-10 w-10 animate-bounce" />
            ) : state === 'speaking' ? (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-6 bg-sky-400 rounded-full animate-pulse" />
                <span className="w-1.5 h-10 bg-sky-400 rounded-full animate-pulse delay-75" />
                <span className="w-1.5 h-8 bg-sky-400 rounded-full animate-pulse delay-150" />
                <span className="w-1.5 h-4 bg-sky-400 rounded-full animate-pulse delay-200" />
              </div>
            ) : (
              <Mic
                className={`h-10 w-10 transition-transform duration-75 ${
                  state === 'listening' ? 'scale-110' : ''
                }`}
              />
            )}
          </div>
        </div>

        {/* Status text badge */}
        <div className="mt-4 text-center">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold tracking-wide ${getStatusColor()}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                state === 'listening'
                  ? 'bg-emerald-500 animate-ping'
                  : state === 'speaking'
                  ? 'bg-sky-500 animate-pulse'
                  : state === 'error'
                  ? 'bg-rose-500'
                  : 'bg-zinc-400'
              }`}
            />
            {getStatusText()}
          </div>
        </div>

        {/* Interruption & Bilingual Guidance */}
        <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
          Speak in Bengali (বাংলা) or English. You can interrupt the AI at any time simply by speaking over it.
        </p>

        {/* Bottom controls */}
        <div className="flex items-center justify-center gap-4 mt-8 w-full">
          <button
            type="button"
            id="voice-end-call-button"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition-colors shadow-lg shadow-rose-600/20 active:scale-95"
          >
            <PhoneOff className="h-4 w-4" />
            End Voice Session
          </button>
        </div>
      </div>
    </div>
  );
};
