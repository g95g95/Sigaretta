/**
 * Player Model
 * 
 * Represents a player in a game room.
 */

import { v4 as uuidv4 } from 'uuid';

export class Player {
  constructor({ name, socketId, isHost = false }) {
    this.id = uuidv4();
    this.name = name;
    this.socketId = socketId;
    this.isHost = isHost;
    this.isReady = false;
    this.isConnected = true;
    this.currentSheetIndex = -1; // Set when game starts
    this.hasSubmittedTurn = false;
    this.joinedAt = new Date();
    this.lastActivity = new Date();
  }

  /**
   * Update player's socket ID (on reconnection)
   */
  updateSocketId(socketId) {
    this.socketId = socketId;
    this.isConnected = true;
    this.lastActivity = new Date();
  }

  /**
   * Mark player as disconnected
   */
  disconnect() {
    this.isConnected = false;
    this.lastActivity = new Date();
  }

  /**
   * Set ready status
   */
  setReady(isReady) {
    this.isReady = isReady;
    this.lastActivity = new Date();
  }

  /**
   * Reset for new turn
   */
  resetTurn() {
    this.hasSubmittedTurn = false;
  }

  /**
   * Mark turn as submitted
   */
  submitTurn() {
    this.hasSubmittedTurn = true;
    this.lastActivity = new Date();
  }

  /**
   * Convert to DTO for client
   */
  toDTO() {
    return {
      id: this.id,
      name: this.name,
      isHost: this.isHost,
      isReady: this.isReady,
      isConnected: this.isConnected,
      hasSubmittedTurn: this.hasSubmittedTurn
    };
  }
}

export default Player;

