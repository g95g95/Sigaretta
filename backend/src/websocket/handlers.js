/**
 * WebSocket Event Handlers
 * 
 * All socket event handlers for the game.
 */

import roomService from '../services/roomService.js';
import gameService from '../services/gameService.js';
import { emitToRoom, emitToPlayer, emitError } from './emitters.js';

// Track socket -> player/room mapping
const socketData = new Map(); // socketId -> { playerId, roomCode }

/**
 * Handle new socket connection
 */
export function handleConnection(io, socket) {
  // Join room
  socket.on('join_room', (data) => handleJoinRoom(io, socket, data));
  
  // Leave room
  socket.on('leave_room', (data) => handleLeaveRoom(io, socket, data));
  
  // Set ready status
  socket.on('set_ready', (data) => handleSetReady(io, socket, data));
  
  // Start game
  socket.on('start_game', (data) => handleStartGame(io, socket, data));
  
  // Submit answer
  socket.on('submit_answer', (data) => handleSubmitAnswer(io, socket, data));
  
  // Return to lobby
  socket.on('return_to_lobby', (data) => handleReturnToLobby(io, socket, data));
  
  // Export story
  socket.on('request_export', (data) => handleExportRequest(io, socket, data));
  
  // Reconnect
  socket.on('reconnect_player', (data) => handleReconnect(io, socket, data));
  
  // Disconnect
  socket.on('disconnect', () => handleDisconnect(io, socket));
}

/**
 * Handle join room
 */
async function handleJoinRoom(io, socket, { roomCode, playerName }) {
  try {
    const code = roomCode.toUpperCase();
    const { room, player } = roomService.joinRoom(code, playerName, socket.id);
    
    // Store socket data
    socketData.set(socket.id, { playerId: player.id, roomCode: code });
    
    // Join socket room
    socket.join(code);
    
    // Send room state to joining player
    socket.emit('room_joined', {
      room: room.toDTO(),
      playerId: player.id
    });
    
    // Notify others
    socket.to(code).emit('player_joined', player.toDTO());
    
    console.log(`👤 ${playerName} joined room ${code}`);
  } catch (error) {
    emitError(socket, error.message);
  }
}

/**
 * Handle leave room
 */
async function handleLeaveRoom(io, socket, { roomCode }) {
  try {
    const data = socketData.get(socket.id);
    if (!data) return;
    
    const { room, newHostId } = roomService.leaveRoom(data.roomCode, data.playerId);
    
    // Leave socket room
    socket.leave(data.roomCode);
    socketData.delete(socket.id);
    
    if (room) {
      // Notify remaining players
      emitToRoom(io, data.roomCode, 'player_left', {
        playerId: data.playerId,
        newHostId
      });
      
      if (newHostId) {
        emitToRoom(io, data.roomCode, 'host_changed', { newHostId });
      }
    }
    
    console.log(`👤 Player left room ${data.roomCode}`);
  } catch (error) {
    emitError(socket, error.message);
  }
}

/**
 * Handle set ready
 */
async function handleSetReady(io, socket, { roomCode, isReady }) {
  try {
    const data = socketData.get(socket.id);
    if (!data) throw new Error('Non sei in una stanza');
    
    const { room, player } = roomService.setPlayerReady(data.roomCode, data.playerId, isReady);
    
    // Notify all players
    emitToRoom(io, data.roomCode, 'player_ready_changed', {
      playerId: data.playerId,
      isReady: player.isReady
    });
  } catch (error) {
    emitError(socket, error.message);
  }
}

/**
 * Handle start game
 */
async function handleStartGame(io, socket, { roomCode }) {
  try {
    const data = socketData.get(socket.id);
    if (!data) throw new Error('Non sei in una stanza');
    
    const room = gameService.startGame(data.roomCode, data.playerId);
    
    // Send game started to all players with their turn data
    for (const player of room.players.values()) {
      const turnData = gameService.getTurnData(data.roomCode, player.id);
      const playerSocket = io.sockets.sockets.get(player.socketId);
      if (playerSocket) {
        playerSocket.emit('game_started', {
          turn: room.currentTurn,
          ...turnData
        });
      }
    }
    
    console.log(`🎮 Game started in room ${data.roomCode}`);
  } catch (error) {
    emitError(socket, error.message);
  }
}

/**
 * Handle submit answer
 */
async function handleSubmitAnswer(io, socket, { roomCode, answer }) {
  try {
    const data = socketData.get(socket.id);
    if (!data) throw new Error('Non sei in una stanza');
    
    const { room, player, allSubmitted } = gameService.submitAnswer(
      data.roomCode, 
      data.playerId, 
      answer
    );
    
    // Notify all players that this player submitted
    emitToRoom(io, data.roomCode, 'player_submitted', {
      playerId: data.playerId
    });
    
    // If all submitted, advance turn
    if (allSubmitted) {
      const { hasMoreTurns } = gameService.advanceTurn(data.roomCode);
      
      emitToRoom(io, data.roomCode, 'turn_complete', {
        turn: room.currentTurn - 1
      });
      
      if (hasMoreTurns) {
        // Send new turn data to each player
        setTimeout(() => {
          for (const p of room.players.values()) {
            const turnData = gameService.getTurnData(data.roomCode, p.id);
            const playerSocket = io.sockets.sockets.get(p.socketId);
            if (playerSocket) {
              playerSocket.emit('turn_started', turnData);
            }
          }
        }, 1000); // Brief delay for transition
      } else {
        // Game complete - send reveal data
        setTimeout(() => {
          for (const p of room.players.values()) {
            const revealData = gameService.getRevealData(data.roomCode, p.id);
            const playerSocket = io.sockets.sockets.get(p.socketId);
            if (playerSocket) {
              playerSocket.emit('game_reveal', revealData);
            }
          }
        }, 1500);
      }
    }
  } catch (error) {
    emitError(socket, error.message);
  }
}

/**
 * Handle return to lobby
 */
async function handleReturnToLobby(io, socket, { roomCode }) {
  try {
    const data = socketData.get(socket.id);
    if (!data) throw new Error('Non sei in una stanza');
    
    const room = gameService.returnToLobby(data.roomCode, data.playerId);
    
    // Notify all players
    emitToRoom(io, data.roomCode, 'returned_to_lobby', {
      room: room.toDTO()
    });
    
    console.log(`🔄 Room ${data.roomCode} returned to lobby`);
  } catch (error) {
    emitError(socket, error.message);
  }
}

/**
 * Handle export request
 * @param {string} format - 'txt' (default) or 'json'
 */
async function handleExportRequest(io, socket, { roomCode, sheetId, format = 'txt' }) {
  try {
    const data = socketData.get(socket.id);
    if (!data) throw new Error('Non sei in una stanza');
    
    const result = gameService.exportStory(data.roomCode, sheetId, format);
    
    socket.emit('export_ready', { 
      story: result.data, 
      format: result.format 
    });
  } catch (error) {
    emitError(socket, error.message);
  }
}

/**
 * Handle reconnect
 */
async function handleReconnect(io, socket, { roomCode, playerId }) {
  try {
    const code = roomCode.toUpperCase();
    const result = roomService.reconnectPlayer(code, playerId, socket.id);
    
    if (!result) {
      throw new Error('Impossibile riconnettersi');
    }
    
    const { room, player } = result;
    
    // Store socket data
    socketData.set(socket.id, { playerId, roomCode: code });
    
    // Join socket room
    socket.join(code);
    
    // Send current state
    socket.emit('reconnected', {
      room: room.toDTO(),
      playerId
    });
    
    // If game is in progress, send turn data
    if (room.state === 'playing') {
      const turnData = gameService.getTurnData(code, playerId);
      socket.emit('turn_started', turnData);
    } else if (room.state === 'reveal') {
      const revealData = gameService.getRevealData(code, playerId);
      socket.emit('game_reveal', revealData);
    }
    
    // Notify others
    socket.to(code).emit('player_reconnected', {
      playerId,
      playerName: player.name
    });
    
    console.log(`🔄 ${player.name} reconnected to room ${code}`);
  } catch (error) {
    emitError(socket, error.message);
  }
}

/**
 * Handle disconnect
 */
async function handleDisconnect(io, socket) {
  const data = socketData.get(socket.id);
  if (!data) return;
  
  try {
    const result = roomService.disconnectPlayer(data.roomCode, data.playerId);
    
    if (result && result.room) {
      // Notify others
      io.to(data.roomCode).emit('player_disconnected', {
        playerId: data.playerId,
        newHostId: result.newHostId
      });
      
      if (result.newHostId) {
        io.to(data.roomCode).emit('host_changed', { newHostId: result.newHostId });
      }
      
      // If in game and player hasn't submitted, handle timeout after delay
      if (result.room.state === 'playing' && result.player && !result.player.hasSubmittedTurn) {
        setTimeout(() => {
          const timeoutResult = gameService.handleTimeout(data.roomCode, data.playerId);
          if (timeoutResult && timeoutResult.allSubmitted) {
            // Trigger turn advancement
            const { hasMoreTurns } = gameService.advanceTurn(data.roomCode);
            
            io.to(data.roomCode).emit('turn_complete', {
              turn: result.room.currentTurn
            });
            
            if (hasMoreTurns) {
              setTimeout(() => {
                for (const p of result.room.players.values()) {
                  if (p.isConnected) {
                    const turnData = gameService.getTurnData(data.roomCode, p.id);
                    const playerSocket = io.sockets.sockets.get(p.socketId);
                    if (playerSocket) {
                      playerSocket.emit('turn_started', turnData);
                    }
                  }
                }
              }, 1000);
            } else {
              setTimeout(() => {
                for (const p of result.room.players.values()) {
                  if (p.isConnected) {
                    const revealData = gameService.getRevealData(data.roomCode, p.id);
                    const playerSocket = io.sockets.sockets.get(p.socketId);
                    if (playerSocket) {
                      playerSocket.emit('game_reveal', revealData);
                    }
                  }
                }
              }, 1500);
            }
          }
        }, 5000); // 5 second grace period
      }
    }
    
    socketData.delete(socket.id);
    console.log(`🔌 Client disconnected: ${socket.id}`);
  } catch (error) {
    console.error('Disconnect error:', error);
    socketData.delete(socket.id);
  }
}

export default { handleConnection };

