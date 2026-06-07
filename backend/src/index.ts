import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database.js';
import apiRoutes from './routes/api.js';
import { setupWebSocket } from './routes/websocket.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api', apiRoutes);

// Serve static frontend in production
const webDistPath = path.resolve(__dirname, '../../web/dist');
app.use(express.static(webDistPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(webDistPath, 'index.html'));
});

// Initialize (async)
initDatabase().then(() => {
  setupWebSocket(wss);

  server.listen(PORT, () => {
    console.log(`Andash server running on http://localhost:${PORT}`);
    console.log(`WebSocket server on ws://localhost:${PORT}/ws`);
  });
});

// Cleanup
process.on('SIGINT', () => {
  console.log('Shutting down...');
  wss.close();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  wss.close();
  server.close();
  process.exit(0);
});
