import { Response } from 'express';
import { StorageService } from '../services/storage.service.js';
import { AuthRequest } from '../types/index.js';

export class ConversationController {
  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const conversations = await StorageService.getUserConversations(userId);
      res.status(200).json({
        success: true,
        conversations,
      });
    } catch (error: any) {
      console.error('[List Conversations Error]:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve conversations.',
        code: 'CONVERSATION_LIST_ERROR',
      });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { title } = req.body;
      const conversation = await StorageService.createConversation(userId, title);
      res.status(201).json({
        success: true,
        conversation,
      });
    } catch (error: any) {
      console.error('[Create Conversation Error]:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create conversation.',
        code: 'CONVERSATION_CREATE_ERROR',
      });
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const conversation = await StorageService.getConversationById(id, userId);
      if (!conversation) {
        res.status(404).json({
          success: false,
          message: 'Conversation not found or unauthorized.',
          code: 'CONVERSATION_NOT_FOUND',
        });
        return;
      }

      const messages = await StorageService.getConversationMessages(id);

      res.status(200).json({
        success: true,
        conversation,
        messages,
      });
    } catch (error: any) {
      console.error('[Get Conversation Error]:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve conversation.',
        code: 'CONVERSATION_GET_ERROR',
      });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { title } = req.body;

      if (!title || typeof title !== 'string' || !title.trim()) {
        res.status(400).json({
          success: false,
          message: 'A valid title is required.',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const updated = await StorageService.updateConversationTitle(id, userId, title.trim());
      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'Conversation not found or unauthorized.',
          code: 'CONVERSATION_NOT_FOUND',
        });
        return;
      }

      res.status(200).json({
        success: true,
        conversation: updated,
      });
    } catch (error: any) {
      console.error('[Update Conversation Error]:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update conversation title.',
        code: 'CONVERSATION_UPDATE_ERROR',
      });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const deleted = await StorageService.deleteConversation(id, userId);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Conversation not found or unauthorized.',
          code: 'CONVERSATION_NOT_FOUND',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Conversation permanently deleted.',
      });
    } catch (error: any) {
      console.error('[Delete Conversation Error]:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete conversation.',
        code: 'CONVERSATION_DELETE_ERROR',
      });
    }
  }

  static async getMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const conversation = await StorageService.getConversationById(id, userId);
      if (!conversation) {
        res.status(404).json({
          success: false,
          message: 'Conversation not found or unauthorized.',
          code: 'CONVERSATION_NOT_FOUND',
        });
        return;
      }

      const messages = await StorageService.getConversationMessages(id);
      res.status(200).json({
        success: true,
        messages,
      });
    } catch (error: any) {
      console.error('[Get Messages Error]:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve messages.',
        code: 'MESSAGES_GET_ERROR',
      });
    }
  }
}
