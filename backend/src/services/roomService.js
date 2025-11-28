/**
 * Room Service
 * 
 * Business logic for room management.
 */

import { Room, RoomState } from '../models/Room.js';
import { Player } from '../models/Player.js';
import roomRepository from '../repositories/roomRepository.js';
import * as validation from '../utils/validation.js';

/**
 * Create a new room
 */
export function createRoom({ roomName, playerName, maxPlayers, wordLimit, hostOnlyStart, turnTimeout }) {
  // Validate inputs
  const roomNameResult = validation.validateRoomName(roomName);
  if (!roomNameResult.valid) throw new Error(roomNameResult.error);
  
  const playerNameResult = validation.validatePlayerName(playerName);
  if (!playerNameResult.valid) throw new Error(playerNameResult.error);
  
  const maxPlayersResult = validation.validateMaxPlayers(maxPlayers);
  if (!maxPlayersResult.valid) throw new Error(maxPlayersResult.error);
  
  const wordLimitResult = validation.validateWordLimit(wordLimit);
  if (!wordLimitResult.valid) throw new Error(wordLimitResult.error);

  // Create room (code will be assigned by repository)
  const room = new Room({
    code: '', // Will be assigned
    name: roomNameResult.value,
    hostId: '', // Will be set after player creation
    settings: {
      maxPlayers: maxPlayersResult.value,
      wordLimit: wordLimitResult.value,
      hostOnlyStart: Boolean(hostOnlyStart),
      turnTimeout: turnTimeout ? parseInt(turnTimeout, 10) : null
    }
  });

  // Save room and get assigned code
  roomRepository.create(room);

  return {
    room,
    hostPlayerName: playerNameResult.value
  };
}

/**
 * Get room by code
 */
export function getRoom(code) {
  const room = roomRepository.findByCode(code);
  if (!room) {
    throw new Error('Stanza non trovata');
  }
  return room;
}

/**
 * Check if room exists
 */
export function roomExists(code) {
  return roomRepository.exists(code);
}

/**
 * Add player to room
 */
export function joinRoom(code, playerName, socketId) {
  const room = getRoom(code);
  
  // Validate player name
  const nameResult = validation.validatePlayerName(playerName);
  if (!nameResult.valid) throw new Error(nameResult.error);

  // Check if room is joinable
  if (room.state !== RoomState.LOBBY) {
    throw new Error('La partita è già iniziata');
  }
  
  if (room.players.size >= room.settings.maxPlayers) {
    throw new Error('La stanza è piena');
  }

  // Check for duplicate names
  const existingNames = Array.from(room.players.values()).map(p => p.name.toLowerCase());
  if (existingNames.includes(nameResult.value.toLowerCase())) {
    throw new Error('Nome già in uso in questa stanza');
  }

  // Create player
  const isHost = room.players.size === 0;
  const player = new Player({
    name: nameResult.value,
    socketId,
    isHost
  });

  // If first player, set as host
  if (isHost) {
    room.hostId = player.id;
  }

  room.addPlayer(player);
  
  return { room, player };
}

/**
 * Remove player from room
 */
export function leaveRoom(code, playerId) {
  const room = roomRepository.findByCode(code);
  if (!room) return { room: null, newHostId: null };

  const newHostId = room.removePlayer(playerId);
  
  // If room is empty, mark for deletion
  if (room.players.size === 0) {
    roomRepository.remove(code);
    return { room: null, newHostId: null };
  }

  return { room, newHostId };
}

/**
 * Handle player disconnection
 */
export function disconnectPlayer(code, playerId) {
  const room = roomRepository.findByCode(code);
  if (!room) return null;

  const player = room.getPlayer(playerId);
  if (!player) return null;

  // In lobby, remove player completely
  if (room.state === RoomState.LOBBY) {
    return leaveRoom(code, playerId);
  }

  // During game, mark as disconnected but keep in game
  player.disconnect();
  
  // If was host, transfer host
  let newHostId = null;
  if (player.isHost) {
    const newHost = room.getFirstConnectedPlayer();
    if (newHost) {
      player.isHost = false;
      newHost.isHost = true;
      room.hostId = newHost.id;
      newHostId = newHost.id;
    }
  }

  return { room, player, newHostId };
}

/**
 * Handle player reconnection
 */
export function reconnectPlayer(code, playerId, socketId) {
  const room = roomRepository.findByCode(code);
  if (!room) return null;

  const player = room.getPlayer(playerId);
  if (!player) return null;

  player.updateSocketId(socketId);
  
  return { room, player };
}

/**
 * Set player ready status
 */
export function setPlayerReady(code, playerId, isReady) {
  const room = getRoom(code);
  const player = room.getPlayer(playerId);
  
  if (!player) {
    throw new Error('Giocatore non trovato');
  }
  
  if (room.state !== RoomState.LOBBY) {
    throw new Error('La partita è già iniziata');
  }

  player.setReady(isReady);
  
  return { room, player };
}

/**
 * Delete room (admin)
 */
export function deleteRoom(code) {
  return roomRepository.remove(code);
}

/**
 * Get all rooms (admin)
 */
export function getAllRooms() {
  return roomRepository.findAll();
}

/**
 * Get server stats (admin)
 */
export function getStats() {
  return roomRepository.getStats();
}

export default {
  createRoom,
  getRoom,
  roomExists,
  joinRoom,
  leaveRoom,
  disconnectPlayer,
  reconnectPlayer,
  setPlayerReady,
  deleteRoom,
  getAllRooms,
  getStats
};

