/**
 * Room Model
 * 
 * Represents a game room with all its state.
 */

import { Player } from './Player.js';
import { Sheet } from './Sheet.js';
import config from '../config/index.js';

// Room states
export const RoomState = {
  LOBBY: 'lobby',
  PLAYING: 'playing',
  REVEAL: 'reveal',
  ENDED: 'ended'
};

export class Room {
  constructor({ code, name, hostId, settings }) {
    this.code = code;
    this.name = name;
    this.hostId = hostId;
    this.settings = {
      maxPlayers: settings.maxPlayers || config.game.maxPlayers,
      wordLimit: settings.wordLimit || config.game.defaultWordLimit,
      hostOnlyStart: settings.hostOnlyStart ?? true,
      turnTimeout: settings.turnTimeout || null
    };
    this.players = new Map(); // playerId -> Player
    this.state = RoomState.LOBBY;
    this.sheets = []; // Array of Sheet objects
    this.currentTurn = 0; // 0-7
    this.turnStartTime = null;
    this.createdAt = new Date();
    this.lastActivity = new Date();
  }

  /**
   * Add a player to the room
   */
  addPlayer(player) {
    if (this.players.size >= this.settings.maxPlayers) {
      throw new Error('Room is full');
    }
    if (this.state !== RoomState.LOBBY) {
      throw new Error('Game already in progress');
    }
    this.players.set(player.id, player);
    this.lastActivity = new Date();
  }

  /**
   * Remove a player from the room
   */
  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return null;

    this.players.delete(playerId);
    this.lastActivity = new Date();

    // If host left, assign new host
    if (player.isHost && this.players.size > 0) {
      const newHost = this.getFirstConnectedPlayer();
      if (newHost) {
        newHost.isHost = true;
        this.hostId = newHost.id;
        return newHost.id;
      }
    }
    return null;
  }

  /**
   * Get player by ID
   */
  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  /**
   * Get player by socket ID
   */
  getPlayerBySocketId(socketId) {
    for (const player of this.players.values()) {
      if (player.socketId === socketId) {
        return player;
      }
    }
    return null;
  }

  /**
   * Get first connected player (for host reassignment)
   */
  getFirstConnectedPlayer() {
    const sortedPlayers = Array.from(this.players.values())
      .filter(p => p.isConnected)
      .sort((a, b) => a.joinedAt - b.joinedAt);
    return sortedPlayers[0] || null;
  }

  /**
   * Get all players as array
   */
  getPlayersArray() {
    return Array.from(this.players.values());
  }

  /**
   * Check if all players are ready
   */
  allPlayersReady() {
    if (this.players.size < config.game.minPlayers) return false;
    return Array.from(this.players.values()).every(p => p.isReady);
  }

  /**
   * Check if a player can start the game
   */
  canStartGame(playerId) {
    if (!this.allPlayersReady()) return false;
    if (this.settings.hostOnlyStart) {
      return playerId === this.hostId;
    }
    return true;
  }

  /**
   * Initialize game - create sheets and assign to players
   */
  initializeGame() {
    const playersArray = this.getPlayersArray();
    
    // Create one sheet per player
    this.sheets = playersArray.map((player, index) => {
      player.currentSheetIndex = index;
      player.hasSubmittedTurn = false;
      player.isReady = false;
      return new Sheet({ originalOwnerId: player.id });
    });

    this.state = RoomState.PLAYING;
    this.currentTurn = 0;
    this.turnStartTime = new Date();
    this.lastActivity = new Date();
  }

  /**
   * Get the sheet currently assigned to a player
   */
  getPlayerCurrentSheet(playerId) {
    const player = this.players.get(playerId);
    if (!player) return null;
    
    const numPlayers = this.players.size;
    const sheetIndex = (player.currentSheetIndex + this.currentTurn) % numPlayers;
    return this.sheets[sheetIndex];
  }

  /**
   * Check if all connected players have submitted
   */
  allPlayersSubmitted() {
    return Array.from(this.players.values())
      .filter(p => p.isConnected)
      .every(p => p.hasSubmittedTurn);
  }

  /**
   * Advance to next turn
   */
  nextTurn() {
    // Reset all players' submission status
    for (const player of this.players.values()) {
      player.hasSubmittedTurn = false;
    }

    this.currentTurn++;
    this.turnStartTime = new Date();
    this.lastActivity = new Date();

    // Check if game is complete
    if (this.currentTurn >= config.game.totalTurns) {
      this.state = RoomState.REVEAL;
      return false; // No more turns
    }
    return true; // More turns to go
  }

  /**
   * Get sheet for reveal (the one that started with this player)
   */
  getPlayerOriginalSheet(playerId) {
    return this.sheets.find(s => s.originalOwnerId === playerId);
  }

  /**
   * End the game
   */
  endGame() {
    this.state = RoomState.ENDED;
    this.lastActivity = new Date();
  }

  /**
   * Return to lobby state
   */
  returnToLobby() {
    this.state = RoomState.LOBBY;
    this.sheets = [];
    this.currentTurn = 0;
    this.turnStartTime = null;
    
    // Reset all players
    for (const player of this.players.values()) {
      player.isReady = false;
      player.hasSubmittedTurn = false;
      player.currentSheetIndex = -1;
    }
    
    this.lastActivity = new Date();
  }

  /**
   * Check if room is empty (no connected players)
   */
  isEmpty() {
    return !Array.from(this.players.values()).some(p => p.isConnected);
  }

  /**
   * Convert to DTO for client
   */
  toDTO() {
    return {
      code: this.code,
      name: this.name,
      hostId: this.hostId,
      settings: this.settings,
      state: this.state,
      players: this.getPlayersArray().map(p => p.toDTO()),
      currentTurn: this.currentTurn
    };
  }
}

export default Room;

