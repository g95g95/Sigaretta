/**
 * Admin Routes
 * 
 * REST API routes for admin/debug operations.
 */

import { Router } from 'express';
import adminController from '../controllers/adminController.js';

const router = Router();

// List all rooms
router.get('/rooms', adminController.listRooms);

// Get server stats
router.get('/stats', adminController.getStats);

// Get detailed room info
router.get('/rooms/:code', adminController.getRoomDetails);

// Delete a room
router.delete('/rooms/:code', adminController.deleteRoom);

export default router;

