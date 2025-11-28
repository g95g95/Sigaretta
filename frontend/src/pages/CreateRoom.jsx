/**
 * Create Room Page
 * 
 * Form to create a new game room.
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createRoom } from '../services/api';
import { joinRoom as socketJoinRoom } from '../services/socket';
import { useGameStore } from '../store/useGameStore';
import { MIN_PLAYERS, MAX_PLAYERS, MIN_WORD_LIMIT, MAX_WORD_LIMIT, DEFAULT_WORD_LIMIT } from '../utils/constants';

export default function CreateRoom() {
  const navigate = useNavigate();
  const { setPlayerInfo, setError, error, clearError, roomCode } = useGameStore();
  
  const [formData, setFormData] = useState({
    roomName: '',
    playerName: '',
    maxPlayers: MAX_PLAYERS,
    wordLimit: DEFAULT_WORD_LIMIT,
    hostOnlyStart: true
  });
  const [isLoading, setIsLoading] = useState(false);

  // Naviga quando roomCode viene settato (significa che room_joined è arrivato)
  useEffect(() => {
    if (roomCode) {
      navigate(`/room/${roomCode}`);
    }
  }, [roomCode, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();

    try {
      // Create room via REST API
      const data = await createRoom({
        roomName: formData.roomName,
        playerName: formData.playerName,
        maxPlayers: parseInt(formData.maxPlayers),
        wordLimit: parseInt(formData.wordLimit),
        hostOnlyStart: formData.hostOnlyStart
      });

      // Store player name
      setPlayerInfo(null, formData.playerName);

      // Join room via WebSocket - la navigazione avverrà quando room_joined arriva
      socketJoinRoom(data.roomCode, formData.playerName);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="page">
      <motion.div 
        className="page-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">Crea Stanza</h1>
            <p className="card-subtitle">Configura la tua partita</p>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="roomName">
                Nome Stanza
              </label>
              <input
                type="text"
                id="roomName"
                name="roomName"
                className="form-input"
                placeholder="es. Serata Folle"
                value={formData.roomName}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={30}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="playerName">
                Il tuo Nome
              </label>
              <input
                type="text"
                id="playerName"
                name="playerName"
                className="form-input"
                placeholder="es. Mario"
                value={formData.playerName}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={20}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="maxPlayers">
                  Max Giocatori
                </label>
                <select
                  id="maxPlayers"
                  name="maxPlayers"
                  className="form-input"
                  value={formData.maxPlayers}
                  onChange={handleChange}
                >
                  {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => i + MIN_PLAYERS).map(n => (
                    <option key={n} value={n}>{n} giocatori</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="wordLimit">
                  Limite Parole
                </label>
                <select
                  id="wordLimit"
                  name="wordLimit"
                  className="form-input"
                  value={formData.wordLimit}
                  onChange={handleChange}
                >
                  {[10, 15, 20, 25, 30, 35, 40].map(n => (
                    <option key={n} value={n}>{n} parole</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  name="hostOnlyStart"
                  checked={formData.hostOnlyStart}
                  onChange={handleChange}
                />
                <span>Solo io posso avviare la partita</span>
              </label>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary btn-lg btn-block"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Creazione...
                  </>
                ) : (
                  'Crea Stanza'
                )}
              </button>
            </div>
          </form>

          <div className="divider"></div>

          <Link to="/" className="btn btn-ghost btn-block">
            ← Torna alla Home
          </Link>
        </div>
      </motion.div>

      <style>{`
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md);
        }

        .form-actions {
          margin-top: var(--space-xl);
        }

        @media (max-width: 480px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

