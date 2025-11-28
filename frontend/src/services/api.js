/**
 * REST API Service
 * 
 * Handles HTTP requests to the backend.
 */

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Make API request
 */
async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Errore di rete');
    }
    
    return data;
  } catch (error) {
    if (error.name === 'TypeError') {
      throw new Error('Impossibile connettersi al server');
    }
    throw error;
  }
}

/**
 * Create a new room
 */
export async function createRoom(roomData) {
  const response = await request('/api/rooms', {
    method: 'POST',
    body: JSON.stringify(roomData)
  });
  return response.data;
}

/**
 * Get room info
 */
export async function getRoom(code) {
  const response = await request(`/api/rooms/${code}`);
  return response.data;
}

/**
 * Check if room exists
 */
export async function roomExists(code) {
  const response = await request(`/api/rooms/${code}/exists`);
  return response.data.exists;
}

export default {
  createRoom,
  getRoom,
  roomExists
};

