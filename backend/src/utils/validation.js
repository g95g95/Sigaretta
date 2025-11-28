/**
 * Input Validation Utilities
 */

import config from '../config/index.js';

/**
 * Sanitize string input (remove HTML, trim, etc.)
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove remaining angle brackets
    .trim()
    .normalize('NFC'); // Normalize unicode
}

/**
 * Validate room name
 */
export function validateRoomName(name) {
  const sanitized = sanitizeString(name);
  if (sanitized.length < 3 || sanitized.length > 30) {
    return { valid: false, error: 'Il nome stanza deve essere tra 3 e 30 caratteri' };
  }
  if (!/^[a-zA-Z0-9\s\-_àèéìòùÀÈÉÌÒÙ]+$/.test(sanitized)) {
    return { valid: false, error: 'Il nome stanza contiene caratteri non validi' };
  }
  return { valid: true, value: sanitized };
}

/**
 * Validate player name
 */
export function validatePlayerName(name) {
  const sanitized = sanitizeString(name);
  if (sanitized.length < 2 || sanitized.length > 20) {
    return { valid: false, error: 'Il nome deve essere tra 2 e 20 caratteri' };
  }
  if (!/^[a-zA-Z0-9\s\-_àèéìòùÀÈÉÌÒÙ]+$/.test(sanitized)) {
    return { valid: false, error: 'Il nome contiene caratteri non validi' };
  }
  return { valid: true, value: sanitized };
}

/**
 * Validate max players
 */
export function validateMaxPlayers(num) {
  const value = parseInt(num, 10);
  if (isNaN(value) || value < config.game.minPlayers || value > config.game.maxPlayers) {
    return { 
      valid: false, 
      error: `Il numero di giocatori deve essere tra ${config.game.minPlayers} e ${config.game.maxPlayers}` 
    };
  }
  return { valid: true, value };
}

/**
 * Validate word limit
 */
export function validateWordLimit(num) {
  const value = parseInt(num, 10);
  if (isNaN(value) || value < config.game.minWordLimit || value > config.game.maxWordLimit) {
    return { 
      valid: false, 
      error: `Il limite parole deve essere tra ${config.game.minWordLimit} e ${config.game.maxWordLimit}` 
    };
  }
  return { valid: true, value };
}

/**
 * Validate answer (check word count)
 */
export function validateAnswer(answer, wordLimit) {
  const sanitized = sanitizeString(answer);
  
  if (sanitized.length === 0) {
    return { valid: false, error: 'La risposta non può essere vuota' };
  }
  
  const wordCount = sanitized.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount > wordLimit) {
    return { 
      valid: false, 
      error: `La risposta supera il limite di ${wordLimit} parole (hai scritto ${wordCount} parole)` 
    };
  }
  
  return { valid: true, value: sanitized };
}

/**
 * Count words in a string
 */
export function countWords(str) {
  if (!str || typeof str !== 'string') return 0;
  return str.trim().split(/\s+/).filter(w => w.length > 0).length;
}

export default {
  sanitizeString,
  validateRoomName,
  validatePlayerName,
  validateMaxPlayers,
  validateWordLimit,
  validateAnswer,
  countWords
};

