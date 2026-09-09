import { Request, Response, NextFunction } from 'express';

export function validateChat(req: Request, res: Response, next: NextFunction): void {
  const { prompt, conversationId, attachments } = req.body;

  if ((!prompt || typeof prompt !== 'string' || !prompt.trim()) && (!attachments || !attachments.length)) {
    res.status(400).json({
      success: false,
      message: 'Prompt or attachment is required.',
      code: 'VALIDATION_ERROR',
      field: 'prompt',
    });
    return;
  }

  if (prompt && prompt.length > 20000) {
    res.status(400).json({
      success: false,
      message: 'Prompt is too long (maximum 20,000 characters).',
      code: 'VALIDATION_ERROR',
      field: 'prompt',
    });
    return;
  }

  if (conversationId && typeof conversationId !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Invalid conversation ID format.',
      code: 'VALIDATION_ERROR',
      field: 'conversationId',
    });
    return;
  }

  next();
}
