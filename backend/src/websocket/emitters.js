/**
 * WebSocket Event Emitters
 * 
 * Helper functions for emitting events.
 */

/**
 * Emit event to all players in a room
 */
export function emitToRoom(io, roomCode, event, data) {
  io.to(roomCode).emit(event, data);
}

/**
 * Emit event to a specific player by socket ID
 */
export function emitToPlayer(io, socketId, event, data) {
  const socket = io.sockets.sockets.get(socketId);
  if (socket) {
    socket.emit(event, data);
  }
}

/**
 * Emit error to a socket
 */
export function emitError(socket, message) {
  socket.emit('room_error', {
    code: 'ERROR',
    message
  });
}

export default { emitToRoom, emitToPlayer, emitError };

