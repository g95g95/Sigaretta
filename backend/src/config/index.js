/**
 * Server Configuration
 * 
 * All configuration values with sensible defaults.
 */

const config = {
  // Server
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // CORS - in development allow localhost, in production use env var
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Game settings
  game: {
    minPlayers: 2,
    maxPlayers: 8,
    minWordLimit: 10,
    maxWordLimit: 40,
    defaultWordLimit: 20,
    totalTurns: 8,
    reconnectTimeout: 60000, // 60 seconds
    roomInactivityTimeout: 3600000, // 1 hour
    pruneInterval: 300000, // 5 minutes
  },
  
  // Room code settings
  roomCode: {
    length: 6,
    characters: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars
  }
};

export default config;

