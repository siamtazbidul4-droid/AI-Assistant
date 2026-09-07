import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, ArrowDown, RefreshCw, AlertCircle, Bot, Zap, Languages, Code2 } from 'lucide-react';
import { Message, Conversation } from '../types';
import { ChatMessage } from './ChatMessage';

interface ChatAreaProps {
  messages: Message[];
  streamingMessageId: string | null;
  isSending: boolean;
  error: string | null;
  onRetry: () => void;
  onClearError: () => void;
  onSelectStarter: (prompt: string) => void;
  currentConversation: Conversation | null;
}

const STARTER_PROMPTS = [
  {
    icon: <Languages className="h-4 w-4 text-emerald-500" />,
    title: 'বাংলায় প্রশ্নোত্তর',
    desc: 'বাংলা সাহিত্যের ইতিহাস বা বিজ্ঞান নিয়ে প্রশ্ন করুন',
    prompt: 'বাংলা ভাষার উৎপত্তি ও ক্রমবিকাশ সংক্ষেপে সহজ ভাষায় বুঝিয়ে দাও।',
  },
  {
    icon: <Code2 className="h-4 w-4 text-sky-500" />,
    title: 'Full-Stack Architecture',
    desc: 'TypeScript, React & Node.js scalable patterns',
    prompt: 'Explain the principles of clean architecture in a Node.js and Express backend with examples.',
  },
  {
    icon: <Zap className="h-4 w-4 text-amber-500" />,
    title: 'Code Review & Refactor',
    desc: 'Attach files or paste algorithms for analysis',
    prompt: 'How do I optimize database indexing and query performance in MongoDB with Mongoose?',
  },
  {
    icon: <Sparkles className="h-4 w-4 text-indigo-500" />,
    title: 'Creative Bilingual Writing',
    desc: 'Poetry, translation & essays in English or Bengali',
    prompt: 'Write an inspiring short poem in Bengali about modern technology and human curiosity.',
  },
];

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  streamingMessageId,
  isSending,
  error,
  onRetry,
  onClearError,
  onSelectStarter,
  currentConversation,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto-scroll when new messages or chunks arrive
  useEffect(() => {
    if (bottomRef.current && !showScrollBottom) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showScrollBottom]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 180;
    setShowScrollBottom(isUp);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      id="chat-messages-container"
      className="relative flex-1 overflow-y-auto scrollbar-thin"
    >
      {/* If conversation is empty, show luxurious welcome state */}
      {messages.length === 0 ? (
        <div className="flex min-h-full flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto my-auto animate-in fade-in duration-300">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-900 shadow-xl mb-6">
            <Sparkles className="h-8 w-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome to AI Assistant
          </h2>
          <p className="mt-1 text-base font-medium text-zinc-500 dark:text-zinc-400">
            বুদ্ধিমত্তা, বিশ্লেষণ ও সৃজনশীলতার সম্পূর্ণ নতুন অভিজ্ঞতা
          </p>

          <p className="mt-3 max-w-md text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Powered by Google Gemini 3.8 & Gemini Live API. Native bilingual support for Bengali and English with real-time streaming, voice conversations, and file analysis.
          </p>

          {/* Starter suggestions */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
            {STARTER_PROMPTS.map((starter, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelectStarter(starter.prompt)}
                className="group flex flex-col justify-between rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-4 transition-all hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    {starter.icon}
                  </div>
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {starter.title}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 line-clamp-2">
                  {starter.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Render messages */
        <div className="flex flex-col py-4">
          {messages.map(msg => (
            <ChatMessage
              key={msg._id}
              message={msg}
              isStreaming={msg._id === streamingMessageId}
            />
          ))}

          {/* Error Banner */}
          {error && (
            <div className="mx-auto my-4 flex w-full max-w-2xl items-center justify-between rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-700 dark:text-rose-300 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-700 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </button>
                <button
                  type="button"
                  onClick={onClearError}
                  className="rounded-lg p-1 text-rose-500 hover:text-rose-700"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} className="h-4" />
        </div>
      )}

      {/* Floating scroll to bottom button */}
      {showScrollBottom && (
        <button
          type="button"
          id="scroll-to-bottom-button"
          onClick={scrollToBottom}
          className="fixed bottom-24 right-8 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200 shadow-lg hover:scale-105 active:scale-95 transition-all"
          title="Scroll to bottom"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
