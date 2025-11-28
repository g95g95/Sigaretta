/**
 * Socket.io Client Service
 * 
 * Handles WebSocket communication with the backend.
 */

import { io } from 'socket.io-client';
import { useGameStore } from '../store/useGameStore';

const WS_URL = import.meta.env.VITE_WS_URL || '';

let socket = null;

/**
 * Initialize socket connection
 */
export function initSocket() {
  if (socket?.connected) return socket;

  socket = io(WS_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  // Connection events
  socket.on('connect', () => {
    console.log('🔌 Connected to server');
    useGameStore.getState().setConnected(true);
    // Non tentiamo riconnessione automatica - l'utente deve ri-entrare nella stanza
  });

  socket.on('disconnect', () => {
    console.log('🔌 Disconnected from server');
    useGameStore.getState().setConnected(false);
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    // Non settiamo errore globale qui - il socket riproverà automaticamente
  });

  // Room events
  socket.on('room_joined', (data) => {
    console.log('🏠 Joined room:', data);
    useGameStore.getState().joinRoom(data);
  });

  socket.on('reconnected', (data) => {
    console.log('🔄 Reconnected to room:', data);
    useGameStore.getState().joinRoom(data);
  });

  socket.on('room_error', (data) => {
    console.error('Room error:', data);
    useGameStore.getState().setError(data.message);
  });

  socket.on('player_joined', (player) => {
    console.log('👤 Player joined:', player);
    useGameStore.getState().addPlayer(player);
  });

  socket.on('player_left', (data) => {
    console.log('👤 Player left:', data);
    useGameStore.getState().removePlayer(data.playerId);
    if (data.newHostId) {
      useGameStore.getState().setHost(data.newHostId);
    }
  });

  socket.on('player_disconnected', (data) => {
    console.log('👤 Player disconnected:', data);
    useGameStore.getState().updatePlayerConnected(data.playerId, false);
    if (data.newHostId) {
      useGameStore.getState().setHost(data.newHostId);
    }
  });

  socket.on('player_reconnected', (data) => {
    console.log('👤 Player reconnected:', data);
    useGameStore.getState().updatePlayerConnected(data.playerId, true);
  });

  socket.on('player_ready_changed', (data) => {
    console.log('✅ Player ready changed:', data);
    useGameStore.getState().updatePlayerReady(data.playerId, data.isReady);
  });

  socket.on('host_changed', (data) => {
    console.log('👑 Host changed:', data);
    useGameStore.getState().setHost(data.newHostId);
  });

  // Game events
  socket.on('game_started', (turnData) => {
    console.log('🎮 Game started:', turnData);
    useGameStore.getState().startGame(turnData);
  });

  socket.on('turn_started', (turnData) => {
    console.log('📝 Turn started:', turnData);
    useGameStore.getState().setTurnData(turnData);
  });

  socket.on('player_submitted', (data) => {
    console.log('✍️ Player submitted:', data);
    useGameStore.getState().updatePlayerSubmitted(data.playerId);
  });

  socket.on('turn_complete', (data) => {
    console.log('✅ Turn complete:', data);
  });

  socket.on('game_reveal', (data) => {
    console.log('🎉 Game reveal:', data);
    useGameStore.getState().setRevealData(data.sheets);
  });

  socket.on('returned_to_lobby', (data) => {
    console.log('🔄 Returned to lobby:', data);
    useGameStore.getState().returnToLobby(data.room);
  });

  socket.on('export_ready', (data) => {
    console.log('📄 Export ready:', data.format);
    // Handle export (download)
    downloadStory(data.story, data.format);
  });

  socket.on('room_closed', (data) => {
    console.log('🚪 Room closed:', data);
    useGameStore.getState().leaveRoom();
    useGameStore.getState().setError(data.reason || 'La stanza è stata chiusa');
  });

  return socket;
}

/**
 * Get socket instance
 */
export function getSocket() {
  if (!socket) {
    return initSocket();
  }
  return socket;
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Socket action helpers

/**
 * Join a room
 */
export function joinRoom(roomCode, playerName) {
  getSocket().emit('join_room', { roomCode, playerName });
}

/**
 * Leave current room
 */
export function leaveRoom(roomCode) {
  getSocket().emit('leave_room', { roomCode });
  useGameStore.getState().leaveRoom();
}

/**
 * Set ready status
 */
export function setReady(roomCode, isReady) {
  getSocket().emit('set_ready', { roomCode, isReady });
}

/**
 * Start the game
 */
export function startGame(roomCode) {
  getSocket().emit('start_game', { roomCode });
}

/**
 * Submit answer
 */
export function submitAnswer(roomCode, answer) {
  getSocket().emit('submit_answer', { roomCode, answer });
  useGameStore.getState().setSubmitted();
}

/**
 * Return to lobby
 */
export function returnToLobby(roomCode) {
  getSocket().emit('return_to_lobby', { roomCode });
}

/**
 * Request story export
 * @param {string} roomCode 
 * @param {string} sheetId 
 * @param {string} format - 'txt' (default) or 'json'
 */
export function requestExport(roomCode, sheetId, format = 'txt') {
  getSocket().emit('request_export', { roomCode, sheetId, format });
}

/**
 * Download story as file
 * @param {string} content - File content
 * @param {string} format - 'txt' or 'json'
 */
function downloadStory(content, format = 'txt') {
  const isJson = format === 'json';
  const mimeType = isJson ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8';
  const extension = isJson ? 'json' : 'txt';
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sigaretta-storia-${Date.now()}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default {
  initSocket,
  getSocket,
  disconnectSocket,
  joinRoom,
  leaveRoom,
  setReady,
  startGame,
  submitAnswer,
  returnToLobby,
  requestExport
};

