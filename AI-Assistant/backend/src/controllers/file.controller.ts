import { Response } from 'express';
import { StorageService } from '../services/storage.service.js';
import { AuthRequest } from '../types/index.js';
import { config } from '../config/index.js';

export class FileController {
  static async upload(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded.',
          code: 'FILE_REQUIRED',
        });
        return;
      }

      // Validate MIME type
      if (!config.allowedMimeTypes.includes(file.mimetype)) {
        res.status(400).json({
          success: false,
          message: `File type '${file.mimetype}' is not supported. Supported types: images (JPEG, PNG, WebP, GIF), PDF, Markdown, text, JSON.`,
          code: 'UNSUPPORTED_MIME_TYPE',
        });
        return;
      }

      // Convert buffer to base64
      const base64Data = file.buffer.toString('base64');
      const dataUrl = `data:${file.mimetype};base64,${base64Data}`;

      const saved = await StorageService.saveFile({
        userId,
        filename: file.filename || file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        dataBase64: base64Data,
      });

      res.status(201).json({
        success: true,
        file: {
          id: saved.id,
          filename: saved.filename,
          originalName: saved.originalName,
          mimeType: saved.mimeType,
          size: saved.size,
          dataUrl,
          createdAt: new Date(),
        },
      });
    } catch (error: any) {
      console.error('[File Upload Error]:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process file upload.',
        code: 'FILE_UPLOAD_ERROR',
      });
    }
  }
}
