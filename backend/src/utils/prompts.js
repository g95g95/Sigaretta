/**
 * Game Prompts
 * 
 * The 8 prompts for each turn of the game.
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

/**
 * Get prompt for a specific turn
 */
export function getPrompt(turn) {
  if (turn < 0 || turn >= PROMPTS.length) {
    return null;
  }
  return PROMPTS[turn];
}

/**
 * Get all prompts
 */
export function getAllPrompts() {
  return PROMPTS;
}

export default { PROMPTS, getPrompt, getAllPrompts };

