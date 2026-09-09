import http from 'http';
import { WebSocketServer } from 'ws';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { setupLiveWebSocket } from './services/live.service.js';
import { config } from './config/index.js';

async function startServer(): Promise<void> {
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);

  const wss = new WebSocketServer({
    server,
    path: '/live',
  });
  setupLiveWebSocket(wss);

  const PORT = config.port || 5000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Backend] Express REST & Live WebSocket server running on port ${PORT}`);
  });
}

// Start if executed directly
if (process.env.NODE_ENV !== 'test') {
  startServer().catch(err => {
    console.error('[Backend] Fatal startup error:', err);
    process.exit(1);
  });
}
