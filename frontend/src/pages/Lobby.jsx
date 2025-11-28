/**
 * Lobby Page
 * 
 * Waiting room before game starts.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { setReady, startGame, leaveRoom } from '../services/socket';
import { copyToClipboard, getShareUrl } from '../utils/helpers';

export default function Lobby() {
  const navigate = useNavigate();
  const { 
    roomCode, 
    roomName, 
    players, 
    playerId, 
    hostId, 
    settings,
    error 
  } = useGameStore();
  
  const [copied, setCopied] = useState(false);
  
  const me = players.find(p => p.id === playerId);
  const isHost = playerId === hostId;
  const allReady = players.every(p => p.isReady);
  const canStart = players.length >= 2 && allReady && (settings.hostOnlyStart ? isHost : true);

  const handleCopyCode = async () => {
    const success = await copyToClipboard(roomCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(getShareUrl(roomCode));
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleReady = () => {
    setReady(roomCode, !me?.isReady);
  };

  const handleStartGame = () => {
    startGame(roomCode);
  };

  const handleLeave = () => {
    leaveRoom(roomCode);
    navigate('/');
  };

  return (
    <div className="page lobby-page">
      <motion.div 
        className="lobby-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="lobby-header">
          <h1 className="lobby-title">{roomName}</h1>
          <div className="room-code-display">
            <span className="room-code-label">Codice Stanza</span>
            <div className="room-code-value" onClick={handleCopyCode}>
              {roomCode}
              <span className="copy-hint">{copied ? '✓ Copiato!' : 'Clicca per copiare'}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleCopyLink}>
            📋 Copia Link Invito
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="error-message">{error}</div>
        )}

        {/* Settings Summary */}
        <div className="lobby-settings">
          <span className="setting-item">
            👥 Max {settings.maxPlayers} giocatori
          </span>
          <span className="setting-item">
            📝 {settings.wordLimit} parole max
          </span>
          {settings.hostOnlyStart && (
            <span className="setting-item">
              👑 Solo host avvia
            </span>
          )}
        </div>

        {/* Players List */}
        <div className="players-section">
          <h2 className="section-title">
            Giocatori ({players.length}/{settings.maxPlayers})
          </h2>
          <div className="players-list">
            <AnimatePresence>
              {players.map((player, index) => (
                <motion.div
                  key={player.id}
                  className={`player-card ${player.id === playerId ? 'is-me' : ''} ${!player.isConnected ? 'disconnected' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="player-info">
                    <span className="player-name">
                      {player.name}
                      {player.id === playerId && <span className="you-badge">(tu)</span>}
                    </span>
                    {player.isHost && (
                      <span className="host-badge">👑 Host</span>
                    )}
                  </div>
                  <div className="player-status">
                    {!player.isConnected ? (
                      <span className="status-badge disconnected">Disconnesso</span>
                    ) : player.isReady ? (
                      <span className="status-badge ready">✓ Pronto</span>
                    ) : (
                      <span className="status-badge not-ready">In attesa...</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Actions */}
        <div className="lobby-actions">
          <button 
            className={`btn btn-lg btn-block ${me?.isReady ? 'btn-secondary' : 'btn-success'}`}
            onClick={handleToggleReady}
          >
            {me?.isReady ? '✗ Non sono pronto' : '✓ Sono pronto!'}
          </button>

          {(isHost || !settings.hostOnlyStart) && (
            <button 
              className="btn btn-primary btn-lg btn-block"
              onClick={handleStartGame}
              disabled={!canStart}
            >
              {!allReady 
                ? 'Aspetta che tutti siano pronti' 
                : players.length < 2 
                  ? 'Servono almeno 2 giocatori'
                  : '🎮 Avvia Partita'}
            </button>
          )}

          {!isHost && settings.hostOnlyStart && (
            <p className="waiting-host-text">
              In attesa che l'host avvii la partita...
            </p>
          )}

          <button className="btn btn-ghost" onClick={handleLeave}>
            Lascia la stanza
          </button>
        </div>
      </motion.div>

      <style>{`
        .lobby-page {
          padding: var(--space-lg);
        }

        .lobby-container {
          width: 100%;
          max-width: 600px;
        }

        .lobby-header {
          text-align: center;
          margin-bottom: var(--space-xl);
        }

        .lobby-title {
          font-size: 2rem;
          margin-bottom: var(--space-md);
        }

        .room-code-display {
          margin-bottom: var(--space-md);
        }

        .room-code-label {
          display: block;
          font-size: 0.85rem;
          color: var(--color-text-muted);
          margin-bottom: var(--space-xs);
        }

        .room-code-value {
          font-family: var(--font-mono);
          font-size: 2.5rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          color: var(--color-accent-primary);
          cursor: pointer;
          transition: color var(--transition-fast);
        }

        .room-code-value:hover {
          color: var(--color-text-accent);
        }

        .copy-hint {
          display: block;
          font-size: 0.75rem;
          color: var(--color-text-muted);
          letter-spacing: normal;
          margin-top: var(--space-xs);
        }

        .lobby-settings {
          display: flex;
          justify-content: center;
          gap: var(--space-lg);
          flex-wrap: wrap;
          margin-bottom: var(--space-xl);
          padding: var(--space-md);
          background: rgba(255, 255, 255, 0.03);
          border-radius: var(--radius-md);
        }

        .setting-item {
          font-size: 0.9rem;
          color: var(--color-text-secondary);
        }

        .players-section {
          margin-bottom: var(--space-xl);
        }

        .section-title {
          font-size: 1.1rem;
          color: var(--color-text-secondary);
          margin-bottom: var(--space-md);
        }

        .players-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .player-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md) var(--space-lg);
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          transition: border-color var(--transition-fast);
        }

        .player-card.is-me {
          border-color: var(--color-accent-primary);
          background: rgba(233, 69, 96, 0.05);
        }

        .player-card.disconnected {
          opacity: 0.5;
        }

        .player-info {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .player-name {
          font-weight: 500;
        }

        .you-badge {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          margin-left: var(--space-xs);
        }

        .host-badge {
          font-size: 0.75rem;
          padding: 2px 8px;
          background: rgba(245, 158, 11, 0.2);
          color: var(--color-warning);
          border-radius: var(--radius-sm);
        }

        .status-badge {
          font-size: 0.85rem;
          padding: 4px 12px;
          border-radius: var(--radius-sm);
        }

        .status-badge.ready {
          background: rgba(16, 185, 129, 0.2);
          color: var(--color-success);
        }

        .status-badge.not-ready {
          background: rgba(107, 114, 128, 0.2);
          color: var(--color-text-muted);
        }

        .status-badge.disconnected {
          background: rgba(239, 68, 68, 0.2);
          color: var(--color-error);
        }

        .lobby-actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          align-items: center;
        }

        .waiting-host-text {
          color: var(--color-text-muted);
          font-style: italic;
          text-align: center;
        }

        @media (max-width: 640px) {
          .lobby-settings {
            flex-direction: column;
            align-items: center;
            gap: var(--space-sm);
          }

          .room-code-value {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}

