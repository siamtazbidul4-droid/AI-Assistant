import React from 'react';
import { X, Shield, BookOpen, FileCheck, Sparkles } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  section: 'about' | 'privacy' | 'terms' | null;
  onClose: () => void;
  onSelectSection: (section: 'about' | 'privacy' | 'terms') => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  section,
  onClose,
  onSelectSection,
}) => {
  if (!isOpen || !section) return null;

  return (
    <div
      id="info-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div
        id="info-modal-card"
        className="relative flex flex-col w-full max-w-2xl max-h-[85vh] rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-4">
          <button
            type="button"
            onClick={() => onSelectSection('about')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              section === 'about'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>About AI Assistant</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectSection('privacy')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              section === 'privacy'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Privacy Policy</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectSection('terms')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              section === 'terms'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <FileCheck className="h-3.5 w-3.5" />
            <span>Terms of Service</span>
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed scrollbar-thin">
          {section === 'about' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                About AI Assistant
              </h3>
              <p>
                AI Assistant is a production-grade, ultra-premium commercial intelligence platform built with React, Node.js, Express, MongoDB, and the Google Gemini API (including Gemini 3.8 Flash and the Gemini Live API for real-time bidirectional voice).
              </p>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Core Capabilities
              </h4>
              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li><strong>Native Bilingual AI:</strong> Fluently understands and converses in both Bengali (বাংলা) and English with automatic language detection and manual instruction overrides.</li>
                <li><strong>Gemini Live Voice:</strong> Real-time streaming audio with 16kHz microphone capture and 24kHz low-latency speech synthesis with live interruption support.</li>
                <li><strong>Multi-modal File Analysis:</strong> Attach images, PDFs, text, and markdown files for analysis and reasoning.</li>
                <li><strong>Progressive Authentication:</strong> Action-gated authorization preserves your draft prompt until login or registration completes.</li>
                <li><strong>Persistent Storage:</strong> Isolated user conversations and message histories backed by MongoDB and Mongoose.</li>
              </ul>
            </div>
          )}

          {section === 'privacy' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Privacy Policy
              </h3>
              <p>
                Your privacy and data isolation are paramount. All user credentials and passwords are cryptographically hashed using industry-standard bcrypt algorithms.
              </p>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Data Isolation & Protection
              </h4>
              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li><strong>Server-Side Secret Isolation:</strong> Gemini API keys, database credentials, and JWT secrets remain strictly on the backend server. The client never accesses or exposes private credentials.</li>
                <li><strong>Strict Resource Ownership:</strong> Users can only access conversations, messages, and uploaded files that belong to their verified authenticated ID.</li>
                <li><strong>No Public Indexing of User Chats:</strong> Conversations are strictly private and shielded from search crawler indexing.</li>
              </ul>
            </div>
          )}

          {section === 'terms' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Terms of Service
              </h3>
              <p>
                By using AI Assistant, you agree to respect community guidelines, avoid using automated bots to abuse model endpoints, and avoid uploading malicious binaries or prohibited content.
              </p>
              <p className="text-xs">
                All AI responses are generated via Google's Gemini models for informational, analytical, and productive tasks. Verify critical technical, medical, or financial information independently.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
