/**
 * WebSocket Setup
 * 
 * Socket.io configuration and handler setup.
 */

import { handleConnection } from './handlers.js';

// Store io instance for use in other modules
let ioInstance = null;

/**
 * Setup Socket.io handlers
 */
export function setupSocketHandlers(io) {
  ioInstance = io;
  
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    handleConnection(io, socket);
  });
  
  console.log('🔌 WebSocket handlers initialized');
}

/**
 * Get io instance
 */
export function getIO() {
  return ioInstance;
}

export default { setupSocketHandlers, getIO };

