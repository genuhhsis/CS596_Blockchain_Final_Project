import React, { useState } from 'react';
import './GameLobby.css';

function GameLobby({ onCreateGame, onJoinGame, onAutoMatchmaking, availableGames, onCleanupTimedOutGames }) {
  const [timeoutPeriod, setTimeoutPeriod] = useState(60); // 1 minutes default

  return (
    <div className="game-lobby">
      <h2>Connect4 Game Lobby</h2>
      
      <div className="lobby-section create-game">
        <h3>Create New Game</h3>
        <div className="input-group">
  <label>Timeout period (seconds):</label>
  <div className="input-with-guidance">
    <input 
      type="number" 
      min="60" 
      value={timeoutPeriod} 
      onChange={(e) => setTimeoutPeriod(Number(e.target.value) < 60 ? 60 : Number(e.target.value))} 
    />
    <div className="input-guidance">Minimum: 60 seconds (1 minute)</div>
  </div>
</div>
        <div className="lobby-actions">
          <div className="button-group">
            <button onClick={() => onCreateGame(timeoutPeriod)}>Create Game</button>
            <button onClick={() => onAutoMatchmaking(timeoutPeriod)}>Auto Matchmaking</button>
          </div>
          <button 
            className="cleanup-button" 
            onClick={onCleanupTimedOutGames}
            title="Resolves any games that have timed out but haven't been closed"
          >
            Cleanup Timed Out Games
          </button>
        </div>
      </div>
      
      <div className="lobby-section available-games">
        <h3>Available Games</h3>
        {availableGames && availableGames.length > 0 ? (
          <div className="game-list">
            {availableGames.map(gameId => (
              <div key={gameId} className="game-item">
                <span>Game #{gameId}</span>
                <button onClick={() => onJoinGame(gameId)}>Join</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-games">No available games. Create a new one!</p>
        )}
      </div>
    </div>
  );
}

export default GameLobby;