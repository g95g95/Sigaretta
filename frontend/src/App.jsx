import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { initSocket, disconnectSocket } from './services/socket';

// Pages
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Reveal from './pages/Reveal';

function App() {
  const { roomCode, roomState, playerId } = useGameStore();

  useEffect(() => {
    // Initialize socket on mount
    initSocket();
    
    return () => {
      disconnectSocket();
    };
  }, []);

  // Protected route wrapper
  const RequireRoom = ({ children }) => {
    if (!roomCode || !playerId) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  // Route based on game state
  const GameRouter = () => {
    switch (roomState) {
      case 'lobby':
        return <Lobby />;
      case 'playing':
        return <Game />;
      case 'reveal':
      case 'ended':
        return <Reveal />;
      default:
        return <Navigate to="/" replace />;
    }
  };

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateRoom />} />
        <Route path="/join" element={<JoinRoom />} />
        <Route path="/join/:code" element={<JoinRoom />} />
        <Route 
          path="/room/:code" 
          element={
            <RequireRoom>
              <GameRouter />
            </RequireRoom>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;

