/**
 * Constants
 */

export const PROMPTS = [
  { turn: 0, prompt: 'Chi è lui?', hint: 'Descrivi un personaggio maschile' },
  { turn: 1, prompt: 'Chi è lei?', hint: 'Descrivi un personaggio femminile' },
  { turn: 2, prompt: 'Dove si trovano?', hint: 'Descrivi il luogo' },
  { turn: 3, prompt: 'Cosa fanno?', hint: 'Descrivi l\'azione' },
  { turn: 4, prompt: 'Cosa dice lui?', hint: 'Scrivi una frase' },
  { turn: 5, prompt: 'Cosa dice lei?', hint: 'Scrivi una risposta' },
  { turn: 6, prompt: 'Chi arriva?', hint: 'Descrivi chi sopraggiunge' },
  { turn: 7, prompt: 'Cosa dice chi arriva?', hint: 'Scrivi la frase finale' }
];

export const ROOM_STATES = {
  LOBBY: 'lobby',
  PLAYING: 'playing',
  REVEAL: 'reveal',
  ENDED: 'ended'
};

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;
export const MIN_WORD_LIMIT = 10;
export const MAX_WORD_LIMIT = 40;
export const DEFAULT_WORD_LIMIT = 20;
export const TOTAL_TURNS = 8;

