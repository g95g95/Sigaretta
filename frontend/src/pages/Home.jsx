/**
 * Home Page
 * 
 * Landing page with options to create or join a room.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { useEffect } from 'react';

export default function Home() {
  const { error, clearError, reset } = useGameStore();

  // Clear any stale state on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  return (
    <div className="page">
      <motion.div 
        className="page-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo/Title */}
        <div className="home-header">
          <motion.div 
            className="home-logo"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            🚬
          </motion.div>
          <motion.h1 
            className="home-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Sigaretta
          </motion.h1>
          <motion.p 
            className="home-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Il gioco delle storie assurde
          </motion.p>
        </div>

        {/* Error message */}
        {error && (
          <motion.div 
            className="error-message"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {error}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div 
          className="home-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link to="/create" className="btn btn-primary btn-lg btn-block">
            Crea Stanza
          </Link>
          <Link to="/join" className="btn btn-secondary btn-lg btn-block">
            Entra in una Stanza
          </Link>
        </motion.div>

        {/* How to play */}
        <motion.div 
          className="home-info"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h3>Come si gioca?</h3>
          <ol>
            <li>Crea una stanza e invita i tuoi amici</li>
            <li>Rispondi alle 8 domande senza vedere le risposte degli altri</li>
            <li>I fogli vengono passati tra i giocatori</li>
            <li>Alla fine, scoprite insieme le storie assurde create!</li>
          </ol>
        </motion.div>
      </motion.div>

      <style>{`
        .home-header {
          text-align: center;
          margin-bottom: var(--space-2xl);
        }

        .home-logo {
          font-size: 5rem;
          margin-bottom: var(--space-md);
          filter: drop-shadow(0 0 20px rgba(233, 69, 96, 0.5));
        }

        .home-title {
          font-size: 3.5rem;
          font-weight: 600;
          margin-bottom: var(--space-sm);
          background: linear-gradient(135deg, var(--color-text-primary), var(--color-accent-primary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .home-subtitle {
          color: var(--color-text-secondary);
          font-size: 1.2rem;
          font-style: italic;
        }

        .home-actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          margin-bottom: var(--space-2xl);
        }

        .home-info {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: var(--space-xl);
        }

        .home-info h3 {
          color: var(--color-text-accent);
          margin-bottom: var(--space-md);
          font-size: 1.1rem;
        }

        .home-info ol {
          color: var(--color-text-secondary);
          padding-left: var(--space-xl);
          line-height: 1.8;
        }

        .home-info li {
          margin-bottom: var(--space-sm);
        }

        @media (max-width: 640px) {
          .home-logo {
            font-size: 4rem;
          }

          .home-title {
            font-size: 2.5rem;
          }
        }
      `}</style>
    </div>
  );
}

