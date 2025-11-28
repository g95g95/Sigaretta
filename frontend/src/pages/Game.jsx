/**
 * Game Page
 * 
 * Main gameplay screen for writing answers.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { submitAnswer } from '../services/socket';
import { countWords } from '../utils/helpers';
import { TOTAL_TURNS } from '../utils/constants';

export default function Game() {
  const { 
    roomCode,
    currentTurn, 
    turnData, 
    hasSubmitted, 
    players, 
    playerId,
    settings
  } = useGameStore();
  
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);
  
  const wordCount = countWords(answer);
  const wordLimit = turnData?.wordLimit || settings.wordLimit;
  const isOverLimit = wordCount > wordLimit;
  
  // Focus textarea on new turn
  useEffect(() => {
    if (!hasSubmitted && textareaRef.current) {
      textareaRef.current.focus();
    }
    setAnswer('');
  }, [currentTurn, hasSubmitted]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!answer.trim() || isOverLimit || hasSubmitted) return;
    
    setIsSubmitting(true);
    submitAnswer(roomCode, answer);
    setIsSubmitting(false);
  };

  // Calculate progress
  const submittedCount = players.filter(p => p.hasSubmittedTurn).length;
  const totalPlayers = players.length;

  return (
    <div className="page game-page">
      <motion.div 
        className="game-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Turn Progress */}
        <div className="turn-progress">
          <div className="turn-indicator">
            Turno {currentTurn + 1} di {TOTAL_TURNS}
          </div>
          <div className="progress-bar">
            <motion.div 
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${((currentTurn + 1) / TOTAL_TURNS) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Prompt Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTurn}
            className="prompt-card"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="prompt-text">{turnData?.prompt}</h2>
            {turnData?.hint && (
              <p className="prompt-hint">{turnData.hint}</p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Previous Line (context) */}
        {turnData?.previousLine && (
          <motion.div 
            className="previous-line"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="previous-label">Riga precedente:</span>
            <p className="previous-content">"{turnData.previousLine}"</p>
          </motion.div>
        )}

        {/* Answer Form */}
        {!hasSubmitted ? (
          <motion.form 
            className="answer-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="textarea-wrapper">
              <textarea
                ref={textareaRef}
                className={`answer-textarea ${isOverLimit ? 'over-limit' : ''}`}
                placeholder="Scrivi la tua risposta..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={4}
                disabled={isSubmitting}
              />
              <div className={`word-counter ${isOverLimit ? 'over-limit' : ''}`}>
                {wordCount}/{wordLimit} parole
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-lg btn-block"
              disabled={!answer.trim() || isOverLimit || isSubmitting}
            >
              {isSubmitting ? 'Invio...' : 'Invia Risposta'}
            </button>
          </motion.form>
        ) : (
          <motion.div 
            className="waiting-section"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="waiting-icon">✓</div>
            <h3>Risposta inviata!</h3>
            <p>In attesa degli altri giocatori...</p>
          </motion.div>
        )}

        {/* Players Progress */}
        <div className="players-progress">
          <div className="progress-header">
            <span>Risposte: {submittedCount}/{totalPlayers}</span>
          </div>
          <div className="players-dots">
            {players.map(player => (
              <div 
                key={player.id}
                className={`player-dot ${player.hasSubmittedTurn ? 'submitted' : ''} ${player.id === playerId ? 'is-me' : ''}`}
                title={player.name}
              >
                <span className="dot-name">{player.name.charAt(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <style>{`
        .game-page {
          padding: var(--space-lg);
        }

        .game-container {
          width: 100%;
          max-width: 600px;
        }

        .turn-progress {
          margin-bottom: var(--space-xl);
        }

        .turn-indicator {
          text-align: center;
          font-size: 0.9rem;
          color: var(--color-text-secondary);
          margin-bottom: var(--space-sm);
        }

        .progress-bar {
          height: 4px;
          background: var(--color-border);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-secondary));
          border-radius: 2px;
        }

        .prompt-card {
          background: var(--color-bg-card);
          border: 2px solid var(--color-accent-primary);
          border-radius: var(--radius-lg);
          padding: var(--space-2xl);
          text-align: center;
          margin-bottom: var(--space-xl);
          box-shadow: var(--shadow-glow);
        }

        .prompt-text {
          font-size: 1.8rem;
          font-weight: 600;
          margin-bottom: var(--space-sm);
          color: var(--color-text-primary);
        }

        .prompt-hint {
          color: var(--color-text-muted);
          font-style: italic;
          margin: 0;
        }

        .previous-line {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: var(--radius-md);
          padding: var(--space-md);
          margin-bottom: var(--space-lg);
        }

        .previous-label {
          display: block;
          font-size: 0.8rem;
          color: var(--color-warning);
          margin-bottom: var(--space-xs);
        }

        .previous-content {
          color: var(--color-text-secondary);
          font-style: italic;
          margin: 0;
        }

        .answer-form {
          margin-bottom: var(--space-xl);
        }

        .textarea-wrapper {
          position: relative;
          margin-bottom: var(--space-md);
        }

        .answer-textarea {
          width: 100%;
          padding: var(--space-lg);
          font-family: var(--font-serif);
          font-size: 1.1rem;
          background: var(--color-bg-input);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          resize: vertical;
          min-height: 120px;
          transition: border-color var(--transition-fast);
        }

        .answer-textarea:focus {
          outline: none;
          border-color: var(--color-accent-primary);
        }

        .answer-textarea.over-limit {
          border-color: var(--color-error);
        }

        .answer-textarea::placeholder {
          color: var(--color-text-muted);
        }

        .word-counter {
          position: absolute;
          bottom: var(--space-sm);
          right: var(--space-md);
          font-size: 0.8rem;
          color: var(--color-text-muted);
        }

        .word-counter.over-limit {
          color: var(--color-error);
          font-weight: 500;
        }

        .waiting-section {
          text-align: center;
          padding: var(--space-2xl);
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-xl);
        }

        .waiting-icon {
          font-size: 3rem;
          color: var(--color-success);
          margin-bottom: var(--space-md);
        }

        .waiting-section h3 {
          color: var(--color-success);
          margin-bottom: var(--space-sm);
        }

        .waiting-section p {
          color: var(--color-text-secondary);
          margin: 0;
        }

        .players-progress {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-md);
        }

        .progress-header {
          text-align: center;
          font-size: 0.85rem;
          color: var(--color-text-secondary);
          margin-bottom: var(--space-md);
        }

        .players-dots {
          display: flex;
          justify-content: center;
          gap: var(--space-sm);
          flex-wrap: wrap;
        }

        .player-dot {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--color-bg-secondary);
          border: 2px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--color-text-muted);
          transition: all var(--transition-fast);
        }

        .player-dot.submitted {
          background: var(--color-success);
          border-color: var(--color-success);
          color: white;
        }

        .player-dot.is-me {
          border-color: var(--color-accent-primary);
        }

        .player-dot.is-me.submitted {
          border-color: var(--color-success);
        }

        @media (max-width: 640px) {
          .prompt-text {
            font-size: 1.4rem;
          }

          .prompt-card {
            padding: var(--space-xl);
          }
        }
      `}</style>
    </div>
  );
}

