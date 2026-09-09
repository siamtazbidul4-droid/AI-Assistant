import { Request } from 'express';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  dataUrl?: string; // base64 representation for Gemini multi-modal
  createdAt: Date;
}

export interface IMessage {
  _id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: IAttachment[];
  language?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversation {
  _id: string;
  userId: string;
  title: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}
