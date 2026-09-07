import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { isDbConnected } from '../config/db.js';
import { UserModel, IUserDocument } from '../models/User.js';
import { ConversationModel, IConversationDocument } from '../models/Conversation.js';
import { MessageModel, IMessageDocument } from '../models/Message.js';
import { FileAttachmentModel } from '../models/FileAttachment.js';
import { IUser, IConversation, IMessage, IAttachment } from '../types/index.js';

interface LocalDB {
  users: IUser[];
  conversations: IConversation[];
  messages: IMessage[];
  files: Array<{
    id: string;
    userId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    dataBase64: string;
    createdAt: Date;
  }>;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadLocalDB(): LocalDB {
  ensureDataDir();
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('[Storage] Error reading db.json, initializing empty state', e);
    }
  }
  const initial: LocalDB = { users: [], conversations: [], messages: [], files: [] };
  saveLocalDB(initial);
  return initial;
}

function saveLocalDB(db: LocalDB): void {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export class StorageService {
  // USER OPERATIONS
  static async createUser(userData: { name: string; email: string; passwordHash: string }): Promise<IUser> {
    if (isDbConnected()) {
      const user = await UserModel.create(userData);
      return {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } else {
      const db = loadLocalDB();
      const existing = db.users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
      if (existing) {
        throw new Error('User with this email already exists');
      }
      const now = new Date();
      const newUser: IUser = {
        _id: crypto.randomUUID(),
        name: userData.name,
        email: userData.email.toLowerCase(),
        passwordHash: userData.passwordHash,
        createdAt: now,
        updatedAt: now,
      };
      db.users.push(newUser);
      saveLocalDB(db);
      return newUser;
    }
  }

  static async findUserByEmail(email: string): Promise<IUser | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (isDbConnected()) {
      const user = await (UserModel as any).findOne({ email: cleanEmail }).lean();
      if (!user) return null;
      return {
        _id: (user._id as mongoose.Types.ObjectId).toString(),
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } else {
      const db = loadLocalDB();
      const user = db.users.find(u => u.email.toLowerCase() === cleanEmail);
      return user || null;
    }
  }

  static async findUserById(id: string): Promise<IUser | null> {
    if (isDbConnected()) {
      try {
        const user = await (UserModel as any).findById(id).lean();
        if (!user) return null;
        return {
          _id: (user._id as mongoose.Types.ObjectId).toString(),
          name: user.name,
          email: user.email,
          passwordHash: user.passwordHash,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      } catch {
        return null;
      }
    } else {
      const db = loadLocalDB();
      const user = db.users.find(u => u._id === id);
      return user || null;
    }
  }

  // CONVERSATION OPERATIONS
  static async createConversation(userId: string, title?: string): Promise<IConversation> {
    const initialTitle = title || 'New Chat';
    if (isDbConnected()) {
      const conv = await (ConversationModel as any).create({
        userId: new mongoose.Types.ObjectId(userId),
        title: initialTitle,
      });
      return {
        _id: conv._id.toString(),
        userId: conv.userId.toString(),
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    } else {
      const db = loadLocalDB();
      const now = new Date();
      const newConv: IConversation = {
        _id: crypto.randomUUID(),
        userId,
        title: initialTitle,
        createdAt: now,
        updatedAt: now,
      };
      db.conversations.push(newConv);
      saveLocalDB(db);
      return newConv;
    }
  }

  static async getUserConversations(userId: string): Promise<IConversation[]> {
    if (isDbConnected()) {
      const convs = await (ConversationModel as any).find({
        userId: new mongoose.Types.ObjectId(userId),
      })
        .sort({ updatedAt: -1 })
        .lean();
      return convs.map((c: any) => ({
        _id: (c._id as mongoose.Types.ObjectId).toString(),
        userId: c.userId.toString(),
        title: c.title,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
    } else {
      const db = loadLocalDB();
      return db.conversations
        .filter(c => c.userId === userId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
  }

  static async getConversationById(id: string, userId: string): Promise<IConversation | null> {
    if (isDbConnected()) {
      try {
        const conv = await (ConversationModel as any).findOne({
          _id: new mongoose.Types.ObjectId(id),
          userId: new mongoose.Types.ObjectId(userId),
        }).lean();
        if (!conv) return null;
        return {
          _id: (conv._id as mongoose.Types.ObjectId).toString(),
          userId: conv.userId.toString(),
          title: conv.title,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        };
      } catch {
        return null;
      }
    } else {
      const db = loadLocalDB();
      const conv = db.conversations.find(c => c._id === id && c.userId === userId);
      return conv || null;
    }
  }

  static async updateConversationTitle(id: string, userId: string, title: string): Promise<IConversation | null> {
    if (isDbConnected()) {
      const conv = await (ConversationModel as any).findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(id),
          userId: new mongoose.Types.ObjectId(userId),
        },
        { title, updatedAt: new Date() },
        { new: true }
      ).lean();
      if (!conv) return null;
      return {
        _id: (conv._id as mongoose.Types.ObjectId).toString(),
        userId: conv.userId.toString(),
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    } else {
      const db = loadLocalDB();
      const index = db.conversations.findIndex(c => c._id === id && c.userId === userId);
      if (index === -1) return null;
      db.conversations[index].title = title;
      db.conversations[index].updatedAt = new Date();
      saveLocalDB(db);
      return db.conversations[index];
    }
  }

  static async deleteConversation(id: string, userId: string): Promise<boolean> {
    if (isDbConnected()) {
      const result = await ConversationModel.deleteOne({
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      });
      if (result.deletedCount > 0) {
        await MessageModel.deleteMany({
          conversationId: new mongoose.Types.ObjectId(id),
        });
        return true;
      }
      return false;
    } else {
      const db = loadLocalDB();
      const initialCount = db.conversations.length;
      db.conversations = db.conversations.filter(c => !(c._id === id && c.userId === userId));
      if (db.conversations.length < initialCount) {
        db.messages = db.messages.filter(m => m.conversationId !== id);
        saveLocalDB(db);
        return true;
      }
      return false;
    }
  }

  // MESSAGE OPERATIONS
  static async createMessage(messageData: {
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: IAttachment[];
    language?: string;
  }): Promise<IMessage> {
    if (isDbConnected()) {
      const msg = await MessageModel.create({
        conversationId: new mongoose.Types.ObjectId(messageData.conversationId),
        role: messageData.role,
        content: messageData.content,
        attachments: messageData.attachments || [],
        language: messageData.language || 'auto',
      });
      // Touch conversation updatedAt
      await (ConversationModel as any).findByIdAndUpdate(messageData.conversationId, {
        updatedAt: new Date(),
      });
      return {
        _id: msg._id.toString(),
        conversationId: msg.conversationId.toString(),
        role: msg.role,
        content: msg.content,
        attachments: msg.attachments,
        language: msg.language,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      };
    } else {
      const db = loadLocalDB();
      const now = new Date();
      const newMsg: IMessage = {
        _id: crypto.randomUUID(),
        conversationId: messageData.conversationId,
        role: messageData.role,
        content: messageData.content,
        attachments: messageData.attachments || [],
        language: messageData.language || 'auto',
        createdAt: now,
        updatedAt: now,
      };
      db.messages.push(newMsg);
      const convIndex = db.conversations.findIndex(c => c._id === messageData.conversationId);
      if (convIndex !== -1) {
        db.conversations[convIndex].updatedAt = now;
      }
      saveLocalDB(db);
      return newMsg;
    }
  }

  static async getConversationMessages(conversationId: string): Promise<IMessage[]> {
    if (isDbConnected()) {
      const messages = await (MessageModel as any).find({
        conversationId: new mongoose.Types.ObjectId(conversationId),
      })
        .sort({ createdAt: 1 })
        .lean();
      return messages.map((m: any) => ({
        _id: (m._id as mongoose.Types.ObjectId).toString(),
        conversationId: m.conversationId.toString(),
        role: m.role,
        content: m.content,
        attachments: m.attachments,
        language: m.language,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      }));
    } else {
      const db = loadLocalDB();
      return db.messages
        .filter(m => m.conversationId === conversationId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
  }

  // FILE OPERATIONS
  static async saveFile(fileData: {
    userId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    dataBase64: string;
  }): Promise<{ id: string; filename: string; originalName: string; mimeType: string; size: number }> {
    if (isDbConnected()) {
      const file = await (FileAttachmentModel as any).create({
        userId: new mongoose.Types.ObjectId(fileData.userId),
        filename: fileData.filename,
        originalName: fileData.originalName,
        mimeType: fileData.mimeType,
        size: fileData.size,
        dataBase64: fileData.dataBase64,
      });
      return {
        id: file._id.toString(),
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
      };
    } else {
      const db = loadLocalDB();
      const id = crypto.randomUUID();
      const record = {
        id,
        userId: fileData.userId,
        filename: fileData.filename,
        originalName: fileData.originalName,
        mimeType: fileData.mimeType,
        size: fileData.size,
        dataBase64: fileData.dataBase64,
        createdAt: new Date(),
      };
      db.files.push(record);
      saveLocalDB(db);
      return {
        id,
        filename: fileData.filename,
        originalName: fileData.originalName,
        mimeType: fileData.mimeType,
        size: fileData.size,
      };
    }
  }

  static async getFile(id: string, userId: string) {
    if (isDbConnected()) {
      return await (FileAttachmentModel as any).findOne({
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      }).lean();
    } else {
      const db = loadLocalDB();
      return db.files.find(f => f.id === id && f.userId === userId) || null;
    }
  }
}
