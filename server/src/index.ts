import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { ClientToServerEvents, ServerToClientEvents } from './shared/protocol';
import { registerHandlers } from './socket/handlers';
import { startCleanupInterval, getRoomCount } from './socket/roomManager';

const PORT = parseInt(process.env.PORT || '3001', 10);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const CORS_ORIGINS = CLIENT_ORIGIN === '*' ? true : [CLIENT_ORIGIN, 'http://localhost:3000'];

const app = express();
app.use(cors({ origin: CORS_ORIGINS }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', rooms: getRoomCount() });
});

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: CORS_ORIGINS,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  registerHandlers(io, socket);
});

// Start room cleanup timer
startCleanupInterval();

httpServer.listen(PORT, () => {
  console.log(`Word Shooter server running on port ${PORT}`);
  console.log(`Accepting connections from: ${CLIENT_ORIGIN}`);
});
