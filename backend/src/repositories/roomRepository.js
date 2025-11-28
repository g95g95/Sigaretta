/**
 * Room Repository
 * 
 * In-memory storage for rooms with automatic pruning.
 */

import config from '../config/index.js';
import { generateRoomCode } from '../utils/codeGenerator.js';

// In-memory storage
const rooms = new Map();

/**
 * Create a new room with unique code
 */
export function create(room) {
  // Generate unique code
  let code = generateRoomCode();
  let attempts = 0;
  while (rooms.has(code) && attempts < 100) {
    code = generateRoomCode();
    attempts++;
  }
  
  if (rooms.has(code)) {
    throw new Error('Could not generate unique room code');
  }
  
  room.code = code;
  rooms.set(code, room);
  return room;
}

/**
 * Get room by code
 */
export function findByCode(code) {
  return rooms.get(code) || null;
}

/**
 * Check if room exists
 */
export function exists(code) {
  return rooms.has(code);
}

/**
 * Delete room
 */
export function remove(code) {
  return rooms.delete(code);
}

/**
 * Get all rooms (for admin)
 */
export function findAll() {
  return Array.from(rooms.values());
}

/**
 * Get room count
 */
export function count() {
  return rooms.size;
}

/**
 * Get stats
 */
export function getStats() {
  const allRooms = findAll();
  const totalPlayers = allRooms.reduce((sum, room) => sum + room.players.size, 0);
  const roomsByState = {
    lobby: 0,
    playing: 0,
    reveal: 0,
    ended: 0
  };
  
  allRooms.forEach(room => {
    roomsByState[room.state]++;
  });
  
  return {
    totalRooms: rooms.size,
    totalPlayers,
    roomsByState,
    timestamp: new Date().toISOString()
  };
}

/**
 * Prune inactive rooms
 */
export function pruneInactive() {
  const now = Date.now();
  const timeout = config.game.roomInactivityTimeout;
  let pruned = 0;
  
  for (const [code, room] of rooms.entries()) {
    const inactiveTime = now - room.lastActivity.getTime();
    
    // Remove if inactive for too long OR if empty and ended
    if (inactiveTime > timeout || (room.isEmpty() && room.state === 'ended')) {
      rooms.delete(code);
      pruned++;
      console.log(`🧹 Pruned room ${code} (inactive for ${Math.round(inactiveTime / 60000)} minutes)`);
    }
  }
  
  if (pruned > 0) {
    console.log(`🧹 Pruned ${pruned} inactive rooms. Active rooms: ${rooms.size}`);
  }
  
  return pruned;
}

/**
 * Start automatic pruning
 */
let pruneInterval = null;

export function startPruning() {
  if (pruneInterval) return;
  
  pruneInterval = setInterval(() => {
    pruneInactive();
  }, config.game.pruneInterval);
  
  console.log(`🧹 Room pruning started (every ${config.game.pruneInterval / 60000} minutes)`);
}

export function stopPruning() {
  if (pruneInterval) {
    clearInterval(pruneInterval);
    pruneInterval = null;
  }
}

export default {
  create,
  findByCode,
  exists,
  remove,
  findAll,
  count,
  getStats,
  pruneInactive,
  startPruning,
  stopPruning
};

