/**
 * Game Service
 * 
 * Business logic for game flow.
 */

import { RoomState } from '../models/Room.js';
import roomService from './roomService.js';
import { getPrompt } from '../utils/prompts.js';
import * as validation from '../utils/validation.js';
import config from '../config/index.js';

/**
 * Start the game
 */
export function startGame(code, playerId) {
  const room = roomService.getRoom(code);
  
  // Validate game can start
  if (room.state !== RoomState.LOBBY) {
    throw new Error('La partita è già iniziata');
  }
  
  if (room.players.size < config.game.minPlayers) {
    throw new Error(`Servono almeno ${config.game.minPlayers} giocatori`);
  }
  
  if (!room.canStartGame(playerId)) {
    if (room.settings.hostOnlyStart) {
      throw new Error('Solo l\'host può avviare la partita');
    }
    throw new Error('Non tutti i giocatori sono pronti');
  }

  // Initialize game
  room.initializeGame();
  
  return room;
}

/**
 * Submit an answer for the current turn
 */
export function submitAnswer(code, playerId, answer) {
  const room = roomService.getRoom(code);
  const player = room.getPlayer(playerId);
  
  if (!player) {
    throw new Error('Giocatore non trovato');
  }
  
  if (room.state !== RoomState.PLAYING) {
    throw new Error('La partita non è in corso');
  }
  
  if (player.hasSubmittedTurn) {
    throw new Error('Hai già inviato la risposta per questo turno');
  }

  // Validate answer
  const answerResult = validation.validateAnswer(answer, room.settings.wordLimit);
  if (!answerResult.valid) {
    throw new Error(answerResult.error);
  }

  // Get player's current sheet and add entry
  const sheet = room.getPlayerCurrentSheet(playerId);
  if (!sheet) {
    throw new Error('Foglio non trovato');
  }

  sheet.addEntry({
    turn: room.currentTurn,
    playerId,
    content: answerResult.value
  });

  player.submitTurn();
  
  // Check if all players have submitted
  const allSubmitted = room.allPlayersSubmitted();
  
  return { room, player, sheet, allSubmitted };
}

/**
 * Advance to next turn (called after all players submit)
 */
export function advanceTurn(code) {
  const room = roomService.getRoom(code);
  
  if (room.state !== RoomState.PLAYING) {
    throw new Error('La partita non è in corso');
  }

  const hasMoreTurns = room.nextTurn();
  
  return { room, hasMoreTurns };
}

/**
 * Get turn data for a player
 */
export function getTurnData(code, playerId) {
  const room = roomService.getRoom(code);
  const player = room.getPlayer(playerId);
  
  if (!player) {
    throw new Error('Giocatore non trovato');
  }

  const sheet = room.getPlayerCurrentSheet(playerId);
  const prompt = getPrompt(room.currentTurn);
  const lastEntry = sheet ? sheet.getLastEntry() : null;

  // Calculate time remaining if timeout is set
  let timeRemaining = null;
  if (room.settings.turnTimeout && room.turnStartTime) {
    const elapsed = (Date.now() - room.turnStartTime.getTime()) / 1000;
    timeRemaining = Math.max(0, room.settings.turnTimeout - elapsed);
  }

  return {
    turn: room.currentTurn,
    prompt: prompt.prompt,
    hint: prompt.hint,
    sheetId: sheet ? sheet.id : null,
    previousLine: lastEntry ? lastEntry.content : null,
    timeRemaining,
    wordLimit: room.settings.wordLimit
  };
}

/**
 * Get reveal data for a player
 */
export function getRevealData(code, playerId) {
  const room = roomService.getRoom(code);
  
  if (room.state !== RoomState.REVEAL && room.state !== RoomState.ENDED) {
    throw new Error('La partita non è in fase di reveal');
  }

  // Get all sheets with reveal data
  const sheets = room.sheets.map(sheet => sheet.toRevealDTO(playerId, room.players));
  
  // Sort so player's own sheet is first
  sheets.sort((a, b) => {
    if (a.isYours && !b.isYours) return -1;
    if (!a.isYours && b.isYours) return 1;
    return 0;
  });

  return { sheets };
}

/**
 * End the game
 */
export function endGame(code) {
  const room = roomService.getRoom(code);
  room.endGame();
  return room;
}

/**
 * Return to lobby
 */
export function returnToLobby(code, playerId) {
  const room = roomService.getRoom(code);
  
  // Only host can return to lobby
  if (room.hostId !== playerId) {
    throw new Error('Solo l\'host può tornare alla lobby');
  }
  
  room.returnToLobby();
  return room;
}

/**
 * Handle AFK timeout for a player
 */
export function handleTimeout(code, playerId) {
  const room = roomService.getRoom(code);
  const player = room.getPlayer(playerId);
  
  if (!player || player.hasSubmittedTurn) {
    return null;
  }

  // Auto-submit with placeholder
  const sheet = room.getPlayerCurrentSheet(playerId);
  if (sheet) {
    sheet.addEntry({
      turn: room.currentTurn,
      playerId,
      content: '...'
    });
  }

  player.submitTurn();
  
  const allSubmitted = room.allPlayersSubmitted();
  
  return { room, player, allSubmitted };
}

/**
 * Export story in specified format
 * @param {string} code - Room code
 * @param {string} sheetId - Sheet ID
 * @param {string} format - 'txt' (default) or 'json'
 */
export function exportStory(code, sheetId, format = 'txt') {
  const room = roomService.getRoom(code);
  const sheet = room.sheets.find(s => s.id === sheetId);
  
  if (!sheet) {
    throw new Error('Storia non trovata');
  }

  const prompts = [
    'Chi è lui?', 'Chi è lei?', 'Dove si trovano?', 'Cosa fanno?',
    'Cosa dice lui?', 'Cosa dice lei?', 'Chi arriva?', 'Cosa dice chi arriva?'
  ];

  // JSON format
  if (format === 'json') {
    const storyData = {
      game: 'Sigaretta',
      roomName: room.name,
      sheetId: sheet.id,
      exportedAt: new Date().toISOString(),
      entries: sheet.entries.map((entry, index) => {
        const author = room.players.get(entry.playerId);
        return {
          turn: index + 1,
          prompt: prompts[index],
          content: entry.content,
          author: author ? author.name : 'Sconosciuto'
        };
      })
    };
    return { format: 'json', data: JSON.stringify(storyData, null, 2) };
  }

  // TXT format (default)
  let story = `🚬 SIGARETTA - Storia\n`;
  story += `Stanza: ${room.name}\n`;
  story += `${'─'.repeat(30)}\n\n`;

  sheet.entries.forEach((entry, index) => {
    const author = room.players.get(entry.playerId);
    story += `${prompts[index]}\n`;
    story += `${entry.content}\n`;
    story += `(scritto da ${author ? author.name : 'Sconosciuto'})\n\n`;
  });

  story += `${'─'.repeat(30)}\n`;
  story += `Giocato il ${new Date().toLocaleDateString('it-IT')}\n`;

  return { format: 'txt', data: story };
}

export default {
  startGame,
  submitAnswer,
  advanceTurn,
  getTurnData,
  getRevealData,
  endGame,
  returnToLobby,
  handleTimeout,
  exportStory
};

