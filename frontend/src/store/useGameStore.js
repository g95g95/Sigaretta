/**
 * Game Store (Zustand)
 * 
 * Central state management for the game.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useGameStore = create(
  persist(
    (set, get) => ({
      // Connection state
      isConnected: false,
      
      // Player state
      playerId: null,
      playerName: '',
      
      // Room state
      roomCode: null,
      roomName: '',
      roomState: null, // 'lobby' | 'playing' | 'reveal' | 'ended'
      hostId: null,
      settings: {
        maxPlayers: 8,
        wordLimit: 20,
        hostOnlyStart: true,
        turnTimeout: null
      },
      players: [],
      
      // Game state
      currentTurn: 0,
      turnData: null, // { turn, prompt, hint, sheetId, previousLine, timeRemaining, wordLimit }
      hasSubmitted: false,
      
      // Reveal state
      revealSheets: [],
      
      // Error state
      error: null,
      
      // Actions
      setConnected: (isConnected) => set({ isConnected }),
      
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      
      setPlayerInfo: (playerId, playerName) => set({ playerId, playerName }),
      
      // Join room - called when room_joined event received
      joinRoom: (data) => set({
        roomCode: data.room.code,
        roomName: data.room.name,
        roomState: data.room.state,
        hostId: data.room.hostId,
        settings: data.room.settings,
        players: data.room.players,
        currentTurn: data.room.currentTurn,
        playerId: data.playerId,
        error: null
      }),
      
      // Update room state
      updateRoomState: (state) => set({ roomState: state }),
      
      // Player joined
      addPlayer: (player) => set((state) => ({
        players: [...state.players, player]
      })),
      
      // Player left
      removePlayer: (playerId) => set((state) => ({
        players: state.players.filter(p => p.id !== playerId)
      })),
      
      // Player ready changed
      updatePlayerReady: (playerId, isReady) => set((state) => ({
        players: state.players.map(p => 
          p.id === playerId ? { ...p, isReady } : p
        )
      })),
      
      // Player submitted
      updatePlayerSubmitted: (playerId) => set((state) => ({
        players: state.players.map(p => 
          p.id === playerId ? { ...p, hasSubmittedTurn: true } : p
        )
      })),
      
      // Host changed
      setHost: (newHostId) => set((state) => ({
        hostId: newHostId,
        players: state.players.map(p => ({
          ...p,
          isHost: p.id === newHostId
        }))
      })),
      
      // Player disconnected
      updatePlayerConnected: (playerId, isConnected) => set((state) => ({
        players: state.players.map(p => 
          p.id === playerId ? { ...p, isConnected } : p
        )
      })),
      
      // Game started
      startGame: (turnData) => set({
        roomState: 'playing',
        currentTurn: turnData.turn,
        turnData,
        hasSubmitted: false,
        players: get().players.map(p => ({ ...p, hasSubmittedTurn: false, isReady: false }))
      }),
      
      // New turn started
      setTurnData: (turnData) => set({
        currentTurn: turnData.turn,
        turnData,
        hasSubmitted: false,
        players: get().players.map(p => ({ ...p, hasSubmittedTurn: false }))
      }),
      
      // Player submitted answer
      setSubmitted: () => set({ hasSubmitted: true }),
      
      // Game reveal
      setRevealData: (sheets) => set({
        roomState: 'reveal',
        revealSheets: sheets
      }),
      
      // Return to lobby
      returnToLobby: (roomData) => set({
        roomState: 'lobby',
        roomName: roomData.name,
        hostId: roomData.hostId,
        settings: roomData.settings,
        players: roomData.players,
        currentTurn: 0,
        turnData: null,
        hasSubmitted: false,
        revealSheets: []
      }),
      
      // Leave room
      leaveRoom: () => set({
        roomCode: null,
        roomName: '',
        roomState: null,
        hostId: null,
        settings: {
          maxPlayers: 8,
          wordLimit: 20,
          hostOnlyStart: true,
          turnTimeout: null
        },
        players: [],
        currentTurn: 0,
        turnData: null,
        hasSubmitted: false,
        revealSheets: [],
        error: null
      }),
      
      // Reset all state
      reset: () => set({
        isConnected: false,
        playerId: null,
        playerName: '',
        roomCode: null,
        roomName: '',
        roomState: null,
        hostId: null,
        settings: {
          maxPlayers: 8,
          wordLimit: 20,
          hostOnlyStart: true,
          turnTimeout: null
        },
        players: [],
        currentTurn: 0,
        turnData: null,
        hasSubmitted: false,
        revealSheets: [],
        error: null
      }),
      
      // Selectors
      isHost: () => get().playerId === get().hostId,
      getPlayer: (id) => get().players.find(p => p.id === id),
      getMe: () => get().players.find(p => p.id === get().playerId),
      allPlayersReady: () => get().players.every(p => p.isReady),
      canStart: () => {
        const state = get();
        if (state.players.length < 2) return false;
        if (!state.players.every(p => p.isReady)) return false;
        if (state.settings.hostOnlyStart && state.playerId !== state.hostId) return false;
        return true;
      }
    }),
    {
      name: 'sigaretta-game',
      partialize: (state) => ({
        playerId: state.playerId,
        playerName: state.playerName,
        roomCode: state.roomCode
      })
    }
  )
);

export default useGameStore;

