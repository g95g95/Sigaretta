/**
 * Sigaretta Game - Main Server Entry Point
 * 
 * This file sets up Express server with Socket.io for real-time communication.
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import config from './src/config/index.js';
import roomRoutes from './src/routes/roomRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import { setupSocketHandlers } from './src/websocket/index.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { startPruning } from './src/repositories/roomRepository.js';

// Create Express app
const app = express();
const httpServer = createServer(app);

// Setup Socket.io with CORS
const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use(errorHandler);

// Setup WebSocket handlers
setupSocketHandlers(io);

// Start room pruning (cleanup inactive rooms)
startPruning();

// Start server
httpServer.listen(config.port, () => {
  console.log(`🚬 Sigaretta server running on port ${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   CORS Origin: ${config.corsOrigin}`);
});

export { io };

