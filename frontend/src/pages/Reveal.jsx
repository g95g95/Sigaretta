/**
 * Reveal Page
 * 
 * Story reveal with scratch-card effect.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { returnToLobby, requestExport, leaveRoom } from '../services/socket';
import { PROMPTS } from '../utils/constants';

export default function Reveal() {
  const navigate = useNavigate();
  const { 
    roomCode, 
    roomName,
    revealSheets, 
    playerId, 
    hostId,
    players 
  } = useGameStore();
  
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [revealedLines, setRevealedLines] = useState({});
  
  const isHost = playerId === hostId;
  const currentSheet = revealSheets[currentSheetIndex];
  const sheetKey = currentSheet?.id || currentSheetIndex;

  const handleRevealLine = (lineIndex) => {
    setRevealedLines(prev => ({
      ...prev,
      [sheetKey]: {
        ...(prev[sheetKey] || {}),
        [lineIndex]: true
      }
    }));
  };

  const isLineRevealed = (lineIndex) => {
    return revealedLines[sheetKey]?.[lineIndex] || false;
  };

  const allLinesRevealed = currentSheet?.entries.every((_, i) => isLineRevealed(i));

  const handleRevealAll = () => {
    const newRevealed = {};
    currentSheet?.entries.forEach((_, i) => {
      newRevealed[i] = true;
    });
    setRevealedLines(prev => ({
      ...prev,
      [sheetKey]: newRevealed
    }));
  };

  const handleNextSheet = () => {
    if (currentSheetIndex < revealSheets.length - 1) {
      setCurrentSheetIndex(currentSheetIndex + 1);
    }
  };

  const handlePrevSheet = () => {
    if (currentSheetIndex > 0) {
      setCurrentSheetIndex(currentSheetIndex - 1);
    }
  };

  const handleExport = () => {
    if (currentSheet) {
      requestExport(roomCode, currentSheet.id);
    }
  };

  const handleReturnToLobby = () => {
    returnToLobby(roomCode);
  };

  const handleLeave = () => {
    leaveRoom(roomCode);
    navigate('/');
  };

  // Get original owner name
  const getOwnerName = () => {
    if (!currentSheet) return '';
    const entry = currentSheet.entries[0];
    if (!entry) return '';
    // Find the player who originally owned this sheet
    const originalOwner = players.find(p => {
      // The sheet belongs to whoever wrote turn 0
      return revealSheets.findIndex(s => s.id === currentSheet.id) === 
             players.findIndex(pl => pl.id === p.id);
    });
    return currentSheet.isYours ? 'La tua storia' : `Storia di ${originalOwner?.name || 'Giocatore'}`;
  };

  return (
    <div className="page reveal-page">
      <motion.div 
        className="reveal-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="reveal-header">
          <h1>🎉 Fine della Partita!</h1>
          <p className="reveal-subtitle">{roomName}</p>
        </div>

        {/* Sheet Navigation */}
        <div className="sheet-navigation">
          <button 
            className="btn btn-ghost btn-sm"
            onClick={handlePrevSheet}
            disabled={currentSheetIndex === 0}
          >
            ← Precedente
          </button>
          <span className="sheet-indicator">
            Storia {currentSheetIndex + 1} di {revealSheets.length}
          </span>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={handleNextSheet}
            disabled={currentSheetIndex === revealSheets.length - 1}
          >
            Successiva →
          </button>
        </div>

        {/* Story Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={sheetKey}
            className={`story-card ${currentSheet?.isYours ? 'is-yours' : ''}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="story-header">
              <h2>{getOwnerName()}</h2>
              {currentSheet?.isYours && (
                <span className="yours-badge">✨ Tua</span>
              )}
            </div>

            <div className="story-lines">
              {currentSheet?.entries.map((entry, index) => (
                <motion.div
                  key={index}
                  className={`story-line ${isLineRevealed(index) ? 'revealed' : 'hidden'}`}
                  onClick={() => !isLineRevealed(index) && handleRevealLine(index)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="line-prompt">
                    {PROMPTS[index]?.prompt}
                  </div>
                  <div className="line-content">
                    {isLineRevealed(index) ? (
                      <>
                        <span className="line-text">{entry.content}</span>
                        <span className="line-author">— {entry.authorName}</span>
                      </>
                    ) : (
                      <span className="line-hidden">
                        Clicca per rivelare...
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {!allLinesRevealed && (
              <button 
                className="btn btn-secondary btn-sm reveal-all-btn"
                onClick={handleRevealAll}
              >
                Rivela tutto
              </button>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="reveal-actions">
          <button className="btn btn-secondary" onClick={handleExport}>
            📄 Esporta Storia
          </button>
          
          {isHost && (
            <button className="btn btn-primary" onClick={handleReturnToLobby}>
              🔄 Nuova Partita
            </button>
          )}
          
          <button className="btn btn-ghost" onClick={handleLeave}>
            Esci dalla stanza
          </button>
        </div>
      </motion.div>

      <style>{`
        .reveal-page {
          padding: var(--space-lg);
        }

        .reveal-container {
          width: 100%;
          max-width: 700px;
        }

        .reveal-header {
          text-align: center;
          margin-bottom: var(--space-xl);
        }

        .reveal-header h1 {
          font-size: 2.5rem;
          margin-bottom: var(--space-sm);
        }

        .reveal-subtitle {
          color: var(--color-text-secondary);
        }

        .sheet-navigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }

        .sheet-indicator {
          font-size: 0.9rem;
          color: var(--color-text-muted);
        }

        .story-card {
          background: var(--color-bg-card);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-xl);
          margin-bottom: var(--space-xl);
        }

        .story-card.is-yours {
          border-color: var(--color-accent-primary);
          box-shadow: var(--shadow-glow);
        }

        .story-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xl);
          padding-bottom: var(--space-md);
          border-bottom: 1px solid var(--color-border);
        }

        .story-header h2 {
          font-size: 1.3rem;
          margin: 0;
        }

        .yours-badge {
          font-size: 0.8rem;
          padding: 4px 12px;
          background: rgba(233, 69, 96, 0.2);
          color: var(--color-accent-primary);
          border-radius: var(--radius-sm);
        }

        .story-lines {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .story-line {
          padding: var(--space-md);
          background: var(--color-bg-input);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .story-line.hidden:hover {
          background: var(--color-bg-secondary);
        }

        .story-line.revealed {
          cursor: default;
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .line-prompt {
          font-size: 0.8rem;
          color: var(--color-accent-primary);
          margin-bottom: var(--space-xs);
          font-weight: 500;
        }

        .line-content {
          min-height: 24px;
        }

        .line-text {
          display: block;
          font-size: 1.1rem;
          color: var(--color-text-primary);
          margin-bottom: var(--space-xs);
        }

        .line-author {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          font-style: italic;
        }

        .line-hidden {
          color: var(--color-text-muted);
          font-style: italic;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .line-hidden::before {
          content: '🎴';
        }

        .reveal-all-btn {
          margin-top: var(--space-lg);
          width: 100%;
        }

        .reveal-actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          align-items: center;
        }

        .reveal-actions .btn {
          min-width: 200px;
        }

        @media (max-width: 640px) {
          .reveal-header h1 {
            font-size: 1.8rem;
          }

          .sheet-navigation {
            flex-direction: column;
            gap: var(--space-sm);
          }

          .story-card {
            padding: var(--space-lg);
          }
        }
      `}</style>
    </div>
  );
}

