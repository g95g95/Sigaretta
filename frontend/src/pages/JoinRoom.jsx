/**
 * Join Room Page
 * 
 * Form to join an existing room.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { roomExists } from '../services/api';
import { joinRoom as socketJoinRoom } from '../services/socket';
import { useGameStore } from '../store/useGameStore';
import { isValidRoomCode } from '../utils/helpers';

export default function JoinRoom() {
  const navigate = useNavigate();
  const { code: urlCode } = useParams();
  const { setPlayerInfo, setError, error, clearError, playerName: storedName } = useGameStore();
  
  const [formData, setFormData] = useState({
    roomCode: urlCode || '',
    playerName: storedName || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [roomValid, setRoomValid] = useState(null);

  // Validate room code when URL code is provided
  useEffect(() => {
    if (urlCode && isValidRoomCode(urlCode)) {
      validateRoom(urlCode);
    }
  }, [urlCode]);

  const validateRoom = async (code) => {
    setIsValidating(true);
    try {
      const exists = await roomExists(code);
      setRoomValid(exists);
      if (!exists) {
        setError('Stanza non trovata');
      } else {
        clearError();
      }
    } catch (err) {
      setRoomValid(false);
      setError(err.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'roomCode') {
      const upperValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      setFormData(prev => ({ ...prev, [name]: upperValue }));
      setRoomValid(null);
      clearError();
      
      // Auto-validate when 6 characters
      if (upperValue.length === 6) {
        validateRoom(upperValue);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isValidRoomCode(formData.roomCode)) {
      setError('Codice stanza non valido');
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      // Check room exists
      const exists = await roomExists(formData.roomCode);
      if (!exists) {
        setError('Stanza non trovata');
        setIsLoading(false);
        return;
      }

      // Store player name
      setPlayerInfo(null, formData.playerName);

      // Join room via WebSocket
      socketJoinRoom(formData.roomCode, formData.playerName);

      // Navigate to room
      navigate(`/room/${formData.roomCode}`);
    } catch (err) {
      setError(err.message);
    } finally {
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
            <h1 className="card-title">Entra in una Stanza</h1>
            <p className="card-subtitle">Inserisci il codice della stanza</p>
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="roomCode">
                Codice Stanza
              </label>
              <div className="room-code-input-wrapper">
                <input
                  type="text"
                  id="roomCode"
                  name="roomCode"
                  className={`form-input room-code-input ${
                    roomValid === true ? 'valid' : 
                    roomValid === false ? 'invalid' : ''
                  }`}
                  placeholder="ABCD12"
                  value={formData.roomCode}
                  onChange={handleChange}
                  required
                  maxLength={6}
                  autoComplete="off"
                  spellCheck="false"
                />
                {isValidating && (
                  <div className="input-status">
                    <span className="spinner"></span>
                  </div>
                )}
                {!isValidating && roomValid === true && (
                  <div className="input-status valid">✓</div>
                )}
                {!isValidating && roomValid === false && (
                  <div className="input-status invalid">✗</div>
                )}
              </div>
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

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary btn-lg btn-block"
                disabled={isLoading || roomValid === false}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Entrando...
                  </>
                ) : (
                  'Entra nella Stanza'
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
        .room-code-input-wrapper {
          position: relative;
        }

        .room-code-input {
          font-family: var(--font-mono);
          font-size: 1.5rem;
          letter-spacing: 0.3em;
          text-align: center;
          text-transform: uppercase;
        }

        .room-code-input.valid {
          border-color: var(--color-success);
        }

        .room-code-input.invalid {
          border-color: var(--color-error);
        }

        .input-status {
          position: absolute;
          right: var(--space-md);
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.2rem;
        }

        .input-status.valid {
          color: var(--color-success);
        }

        .input-status.invalid {
          color: var(--color-error);
        }

        .form-actions {
          margin-top: var(--space-xl);
        }
      `}</style>
    </div>
  );
}

