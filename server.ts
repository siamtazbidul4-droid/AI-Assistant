import http from 'http';
import path from 'path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';

// Backend DB & Services
import { connectDB, isDbConnected } from './AI-Assistant/backend/src/config/db.js';
import { setupLiveWebSocket } from './AI-Assistant/backend/src/services/live.service.js';
import authRoutes from './AI-Assistant/backend/src/routes/auth.routes.js';
import conversationRoutes from './AI-Assistant/backend/src/routes/conversation.routes.js';
import chatRoutes from './AI-Assistant/backend/src/routes/chat.routes.js';
import fileRoutes from './AI-Assistant/backend/src/routes/file.routes.js';
import { errorHandler } from './AI-Assistant/backend/src/middleware/errorHandler.js';

const PORT = 3000;

async function startServer() {
  // Initialize Database / File persistence
  await connectDB();

  const app = express();
  app.set('trust proxy', 1);

  // CORS for credentials & cookies
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Lightweight Health Check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'AI Assistant Unified Server',
      database: isDbConnected() ? 'mongodb' : 'file-persistent',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Mount API endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/files', fileRoutes);

  // API Error handler (must be registered after API routes)
  app.use('/api', errorHandler);

  const server = http.createServer(app);

  // Setup WebSocket for Gemini Live API on /live
  const wss = new WebSocketServer({
    server,
    path: '/live',
  });
  setupLiveWebSocket(wss);

  // Vite middleware for frontend SPA in development, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[AI Assistant] Unified Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[AI Assistant] Fatal startup error:', err);
  process.exit(1);
});
