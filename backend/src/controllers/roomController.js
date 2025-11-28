/**
 * Room Controller
 * 
 * REST API handlers for room operations.
 */

import roomService from '../services/roomService.js';

/**
 * POST /api/rooms - Create a new room
 */
export async function createRoom(req, res, next) {
  try {
    const { roomName, playerName, maxPlayers, wordLimit, hostOnlyStart, turnTimeout } = req.body;
    
    const { room, hostPlayerName } = roomService.createRoom({
      roomName,
      playerName,
      maxPlayers,
      wordLimit,
      hostOnlyStart,
      turnTimeout
    });

    res.status(201).json({
      success: true,
      data: {
        roomCode: room.code,
        roomName: room.name,
        hostPlayerName,
        settings: room.settings
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/rooms/:code - Get room info
 */
export async function getRoom(req, res, next) {
  try {
    const { code } = req.params;
    const room = roomService.getRoom(code.toUpperCase());
    
    res.json({
      success: true,
      data: room.toDTO()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/rooms/:code/exists - Check if room exists
 */
export async function roomExists(req, res, next) {
  try {
    const { code } = req.params;
    const exists = roomService.roomExists(code.toUpperCase());
    
    res.json({
      success: true,
      data: { exists }
    });
  } catch (error) {
    next(error);
  }
}

export default {
  createRoom,
  getRoom,
  roomExists
};

