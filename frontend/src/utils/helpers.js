/**
 * Helper Functions
 */

/**
 * Count words in a string
 */
export function countWords(str) {
  if (!str || typeof str !== 'string') return 0;
  return str.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Format time remaining
 */
export function formatTime(seconds) {
  if (seconds == null) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Generate share URL
 */
export function getShareUrl(roomCode) {
  return `${window.location.origin}/join/${roomCode}`;
}

/**
 * Validate room code format
 */
export function isValidRoomCode(code) {
  if (!code || typeof code !== 'string') return false;
  if (code.length !== 6) return false;
  return /^[A-Z0-9]+$/.test(code.toUpperCase());
}

