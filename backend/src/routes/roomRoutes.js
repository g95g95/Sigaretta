/**
 * Room Routes
 * 
 * REST API routes for room operations.
 */

import { Router } from 'express';
import roomController from '../controllers/roomController.js';

const router = Router();

// Create a new room
router.post('/', roomController.createRoom);

// Get room info
router.get('/:code', roomController.getRoom);

// Check if room exists
router.get('/:code/exists', roomController.roomExists);

export default router;

