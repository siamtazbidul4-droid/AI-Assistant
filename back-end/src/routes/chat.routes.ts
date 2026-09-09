import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { validateChat } from '../validators/chat.validator.js';

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 requests per minute
  message: 'Chat request rate limit reached. Please wait a moment before sending another prompt.',
});

// Chat requires authentication (action-gated)
router.post('/', authMiddleware, chatLimiter, validateChat, ChatController.streamChat);

export default router;
