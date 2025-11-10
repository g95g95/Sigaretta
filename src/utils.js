export function slugify(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function randomId(length = 8) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function clampWords(input, maxWords) {
  const cleaned = input
    .replace(/\s+/g, ' ')
    .trim();
  if (!maxWords || maxWords <= 0) {
    return cleaned;
  }
  const words = cleaned.split(' ');
  if (words.length <= maxWords) {
    return cleaned;
  }
  return words.slice(0, maxWords).join(' ');
}

export function countWords(input) {
  const cleaned = input
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 0;
  return cleaned.split(' ').length;
}

export function formatDateDistance(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.round(diff / 60000);
  if (minutes <= 1) return 'un minuto fa';
  if (minutes < 60) return `${minutes} minuti fa`;
  const hours = Math.round(minutes / 60);
  if (hours === 1) return 'un’ora fa';
  if (hours < 24) return `${hours} ore fa`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'ieri';
  return `${days} giorni fa`;
}
