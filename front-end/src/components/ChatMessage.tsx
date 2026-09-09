import React, { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  FileText,
  Sparkles,
  User as UserIcon,
  Download,
  Terminal,
} from 'lucide-react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`group flex w-full gap-4 px-4 py-6 transition-colors ${
        isUser
          ? 'bg-transparent'
          : 'bg-zinc-50/70 dark:bg-zinc-900/40 border-y border-zinc-100/80 dark:border-zinc-800/40'
      }`}
    >
      <div className="mx-auto flex w-full max-w-3xl gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-sm">
              <UserIcon className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-900 shadow-md">
              <Sparkles className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {isUser ? 'You' : 'AI Assistant'}
            </span>

            {/* Copy button for Assistant */}
            {!isUser && message.content && (
              <button
                type="button"
                onClick={() => handleCopyText(message.content)}
                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-opacity"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy response</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Attachments preview */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {message.attachments.map(att => {
                const isImg = att.mimeType.startsWith('image/');
                return (
                  <div
                    key={att.id}
                    className="flex items-center gap-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/80 p-2 text-xs shadow-sm max-w-xs"
                  >
                    {isImg && att.dataUrl ? (
                      <img
                        src={att.dataUrl}
                        alt={att.originalName}
                        referrerPolicy="no-referrer"
                        className="h-12 w-12 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                        <FileText className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {att.originalName}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {(att.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Message Content or Thinking state */}
          {message.content ? (
            <div className="markdown-body prose dark:prose-invert max-w-none text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal">
              <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeText = String(children).replace(/\n$/, '');

                    if (!inline && match) {
                      return (
                        <div className="relative my-3 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 overflow-hidden">
                          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-3.5 py-1.5 text-xs text-zinc-400">
                            <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase">
                              <Terminal className="h-3 w-3 text-sky-400" />
                              {match[1]}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(codeText)}
                              className="flex items-center gap-1 hover:text-white transition-colors"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy code</span>
                            </button>
                          </div>
                          <pre className="p-3.5 text-xs overflow-x-auto font-mono">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      );
                    }
                    return (
                      <code
                        className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-xs font-mono text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </Markdown>
              {isStreaming && (
                <span className="inline-block h-3.5 w-1.5 ml-1 animate-pulse bg-zinc-600 dark:bg-zinc-300 align-middle rounded-sm" />
              )}
            </div>
          ) : isStreaming ? (
            // Thinking state
            <div className="flex items-center gap-2.5 py-1 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce delay-150" />
                <span className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce delay-300" />
              </div>
              <span className="font-medium italic">Thinking...</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
