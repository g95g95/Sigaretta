/**
 * Admin Controller
 * 
 * REST API handlers for admin/debug operations.
 */

import roomService from '../services/roomService.js';

/**
 * GET /api/admin/rooms - List all rooms
 */
export async function listRooms(req, res, next) {
  try {
    const rooms = roomService.getAllRooms();
    
    res.json({
      success: true,
      data: rooms.map(room => ({
        code: room.code,
        name: room.name,
        state: room.state,
        playerCount: room.players.size,
        maxPlayers: room.settings.maxPlayers,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity
      }))
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/stats - Get server stats
 */
export async function getStats(req, res, next) {
  try {
    const stats = roomService.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/admin/rooms/:code - Delete a room
 */
export async function deleteRoom(req, res, next) {
  try {
    const { code } = req.params;
    const deleted = roomService.deleteRoom(code.toUpperCase());
    
    res.json({
      success: true,
      data: { deleted }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/rooms/:code - Get detailed room info
 */
export async function getRoomDetails(req, res, next) {
  try {
    const { code } = req.params;
    const room = roomService.getRoom(code.toUpperCase());
    
    res.json({
      success: true,
      data: {
        ...room.toDTO(),
        sheets: room.sheets.map(s => ({
          id: s.id,
          originalOwnerId: s.originalOwnerId,
          entriesCount: s.entries.length
        })),
        createdAt: room.createdAt,
        lastActivity: room.lastActivity
      }
    });
  } catch (error) {
    next(error);
  }
}

export default {
  listRooms,
  getStats,
  deleteRoom,
  getRoomDetails
};

