import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All conversation routes require authentication
router.use(authMiddleware);

router.get('/', ConversationController.list);
router.post('/', ConversationController.create);
router.get('/:id', ConversationController.getById);
router.patch('/:id', ConversationController.update);
router.delete('/:id', ConversationController.delete);
router.get('/:id/messages', ConversationController.getMessages);

export default router;
