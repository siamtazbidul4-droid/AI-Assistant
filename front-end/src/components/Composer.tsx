import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Paperclip,
  Smile,
  Mic,
  X,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Attachment } from '../types';
import { api } from '../services/api';
import { EmojiPicker } from './EmojiPicker';

interface ComposerProps {
  onSend: (prompt: string, attachments: Attachment[]) => void;
  onOpenVoice: () => void;
  isSending: boolean;
  disabled?: boolean;
  initialDraft?: string;
  initialAttachments?: Attachment[];
}

export const Composer: React.FC<ComposerProps> = ({
  onSend,
  onOpenVoice,
  isSending,
  disabled = false,
  initialDraft = '',
  initialAttachments = [],
}) => {
  const [prompt, setPrompt] = useState(initialDraft);
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync draft if initialDraft updates from auth preservation
  useEffect(() => {
    if (initialDraft) setPrompt(initialDraft);
  }, [initialDraft]);

  useEffect(() => {
    if (initialAttachments.length) setAttachments(initialAttachments);
  }, [initialAttachments]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [prompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!prompt.trim() && attachments.length === 0) || isSending || isUploading || disabled) {
      return;
    }
    const submittedPrompt = prompt.trim();
    const submittedAttachments = [...attachments];

    // Clear local composer state
    setPrompt('');
    setAttachments([]);
    setUploadError(null);
    setShowEmojiPicker(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    onSend(submittedPrompt, submittedAttachments);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds 10MB size limit.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await api.uploadFile(file);
      if (res.success && res.file) {
        setAttachments(prev => [...prev, res.file]);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload attachment.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleEmojiSelect = (emoji: string) => {
    setPrompt(prev => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const canSubmit = (prompt.trim().length > 0 || attachments.length > 0) && !isSending && !isUploading;

  return (
    <div className="relative w-full max-w-3xl mx-auto px-4 pb-4">
      {/* Upload error banner */}
      {uploadError && (
        <div className="mb-2 flex items-center justify-between rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Attachments preview chips */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map(att => {
            const isImg = att.mimeType.startsWith('image/');
            return (
              <div
                key={att.id}
                className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs shadow-sm"
              >
                {isImg && att.dataUrl ? (
                  <img
                    src={att.dataUrl}
                    alt={att.originalName}
                    referrerPolicy="no-referrer"
                    className="h-7 w-7 rounded-lg object-cover"
                  />
                ) : (
                  <FileText className="h-4 w-4 text-zinc-400" />
                )}
                <span className="max-w-[120px] truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {att.originalName}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Composer Box */}
      <div className="relative rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:ring-2 focus-within:ring-zinc-400/20 dark:focus-within:ring-zinc-600/20 transition-all p-2.5">
        <textarea
          ref={textareaRef}
          id="chat-composer-textarea"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything in English or বাংলায় প্রশ্ন করুন..."
          rows={1}
          disabled={disabled}
          className="w-full resize-none border-0 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-0 max-h-48 leading-relaxed scrollbar-thin"
        />

        {/* Action toolbar */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60 mt-1">
          <div className="relative flex items-center gap-1">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              id="composer-file-input"
              onChange={handleFileChange}
              accept="image/*,application/pdf,text/plain,text/markdown,application/json"
              className="hidden"
            />

            {/* Attachment button */}
            <button
              type="button"
              id="composer-attach-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || disabled}
              title="Attach image or document (PDF, TXT)"
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </button>

            {/* Emoji picker toggle button */}
            <button
              type="button"
              id="composer-emoji-button"
              onClick={() => setShowEmojiPicker(prev => !prev)}
              disabled={disabled}
              title="Add emoji"
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                showEmojiPicker
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                  : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              <Smile className="h-4 w-4" />
            </button>

            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Voice trigger button */}
            <button
              type="button"
              id="composer-voice-button"
              onClick={onOpenVoice}
              title="Start Gemini Live Voice Session"
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              <Mic className="h-4 w-4" />
            </button>

            {/* Send Button */}
            <button
              type="button"
              id="composer-send-button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              title="Send prompt"
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all shadow-sm ${
                canSubmit
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-105 active:scale-95'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
              }`}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
