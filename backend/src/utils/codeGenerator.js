/**
 * Room Code Generator
 * 
 * Generates unique, human-readable room codes.
 */

import config from '../config/index.js';

/**
 * Generate a random room code
 */
export function generateRoomCode() {
  const { length, characters } = config.roomCode;
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  
  return code;
}

/**
 * Validate room code format
 */
export function isValidRoomCode(code) {
  if (!code || typeof code !== 'string') return false;
  if (code.length !== config.roomCode.length) return false;
  
  const validChars = new Set(config.roomCode.characters);
  return code.split('').every(char => validChars.has(char));
}

export default { generateRoomCode, isValidRoomCode };

