export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  dataUrl?: string;
  createdAt?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  language?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Conversation {
  _id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'interrupted' | 'error';
