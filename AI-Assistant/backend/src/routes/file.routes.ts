import { Router } from 'express';
import multer from 'multer';
import { FileController } from '../controllers/file.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { config } from '../config/index.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize, // 10MB
  },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Upload rate limit reached. Please wait a moment.',
});

router.post('/upload', authMiddleware, uploadLimiter, upload.single('file'), FileController.upload);

export default router;
