import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { ChatArea } from '../components/ChatArea';
import { Composer } from '../components/Composer';
import { VoiceModal } from '../components/VoiceModal';
import { AuthModal } from '../components/AuthModal';
import { DeleteModal } from '../components/DeleteModal';
import { RenameModal } from '../components/RenameModal';
import { InfoModal } from '../components/InfoModal';
import { useChat } from '../hooks/useChat';
import { useVoice } from '../hooks/useVoice';
import { Conversation, Attachment } from '../types';

export const ChatPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  // Modals for conversation actions
  const [deletingConv, setDeletingConv] = useState<Conversation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [renamingConv, setRenamingConv] = useState<Conversation | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  const [infoSection, setInfoSection] = useState<'about' | 'privacy' | 'terms' | null>(null);

  // Chat & Voice Hooks
  const {
    conversations,
    groupedConversations,
    currentConversationId,
    messages,
    isSending,
    streamingMessageId,
    error,
    selectConversation,
    startNewChat,
    sendMessage,
    renameConversation,
    deleteConversation,
    clearError,
  } = useChat();

  const {
    state: voiceState,
    audioLevel,
    errorMessage: voiceError,
    startVoice,
    stopVoice,
  } = useVoice();

  const handleOpenVoice = () => {
    setIsVoiceOpen(true);
    startVoice();
  };

  const handleCloseVoice = () => {
    stopVoice();
    setIsVoiceOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingConv) return;
    setIsDeleting(true);
    try {
      await deleteConversation(deletingConv._id);
      setDeletingConv(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmRename = async (newTitle: string) => {
    if (!renamingConv) return;
    setIsRenaming(true);
    try {
      await renameConversation(renamingConv._id, newTitle);
      setRenamingConv(null);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleSelectStarter = (prompt: string) => {
    sendMessage(prompt, []);
  };

  const currentConv = conversations.find(c => c._id === currentConversationId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      {/* Sidebar for Navigation and History */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        groupedConversations={groupedConversations}
        currentConversationId={currentConversationId}
        onSelectConversation={selectConversation}
        onNewChat={startNewChat}
        onOpenRename={conv => setRenamingConv(conv)}
        onOpenDelete={conv => setDeletingConv(conv)}
        onOpenInfo={sec => setInfoSection(sec)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        <Header
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          onNewChat={startNewChat}
          onOpenVoice={handleOpenVoice}
        />

        {/* Messages feed */}
        <ChatArea
          messages={messages}
          streamingMessageId={streamingMessageId}
          isSending={isSending}
          error={error}
          onRetry={() => {
            if (messages.length >= 2) {
              const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
              if (lastUserMsg) {
                sendMessage(lastUserMsg.content, lastUserMsg.attachments || []);
              }
            }
          }}
          onClearError={clearError}
          onSelectStarter={handleSelectStarter}
          currentConversation={currentConv}
        />

        {/* Input composer */}
        <Composer
          onSend={(prompt, attachments) => sendMessage(prompt, attachments)}
          onOpenVoice={handleOpenVoice}
          isSending={isSending}
        />
      </div>

      {/* Interactive Voice Modal (Gemini Live) */}
      <VoiceModal
        isOpen={isVoiceOpen}
        state={voiceState}
        audioLevel={audioLevel}
        errorMessage={voiceError}
        onClose={handleCloseVoice}
      />

      {/* Progressive Auth Modal */}
      <AuthModal />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deletingConv}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingConv(null)}
      />

      {/* Rename Modal */}
      <RenameModal
        isOpen={!!renamingConv}
        initialTitle={renamingConv?.title || ''}
        isRenaming={isRenaming}
        onConfirm={handleConfirmRename}
        onCancel={() => setRenamingConv(null)}
      />

      {/* Public Info Modal */}
      <InfoModal
        isOpen={!!infoSection}
        section={infoSection}
        onClose={() => setInfoSection(null)}
        onSelectSection={sec => setInfoSection(sec)}
      />
    </div>
  );
};
