import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import conversationRoutes from './routes/conversation.routes.js';
import chatRoutes from './routes/chat.routes.js';
import fileRoutes from './routes/file.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { isDbConnected } from './config/db.js';

export function createApp(): Express {
  const app = express();

  // Trust proxy for rate limiting and secure cookies behind reverse proxy
  app.set('trust proxy', 1);

  // Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: true, // Allow requesting origin
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Lightweight Health Check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'AI Assistant Backend API',
      database: isDbConnected() ? 'mongodb' : 'file-persistent',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/files', fileRoutes);

  // Error handling middleware
  app.use(errorHandler);

  return app;
}
