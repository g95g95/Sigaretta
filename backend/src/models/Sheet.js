/**
 * Sheet Model
 * 
 * Represents a story sheet that gets passed between players.
 * Each sheet contains 8 entries (one per turn).
 */

import { v4 as uuidv4 } from 'uuid';

export class Sheet {
  constructor({ originalOwnerId }) {
    this.id = uuidv4();
    this.originalOwnerId = originalOwnerId;
    this.entries = []; // Array of SheetEntry objects
  }

  /**
   * Add an entry for a turn
   */
  addEntry({ turn, playerId, content }) {
    this.entries.push({
      turn,
      playerId,
      content,
      timestamp: new Date()
    });
  }

  /**
   * Get entry for a specific turn
   */
  getEntry(turn) {
    return this.entries.find(e => e.turn === turn);
  }

  /**
   * Get the last entry (for context to next player)
   */
  getLastEntry() {
    if (this.entries.length === 0) return null;
    return this.entries[this.entries.length - 1];
  }

  /**
   * Check if sheet is complete (all 8 turns)
   */
  isComplete() {
    return this.entries.length === 8;
  }

  /**
   * Convert to DTO for reveal phase
   */
  toRevealDTO(playerId, players) {
    return {
      id: this.id,
      isYours: this.originalOwnerId === playerId,
      entries: this.entries.map(entry => {
        const author = players.get(entry.playerId);
        return {
          turn: entry.turn,
          revealed: false,
          content: entry.content,
          authorName: author ? author.name : 'Sconosciuto'
        };
      })
    };
  }
}

export default Sheet;

