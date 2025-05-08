import { ethers } from 'ethers';
import React, { useState, useEffect, useCallback } from 'react';
import { getContractInstance, formatGameData, checkNetwork, switchToCorrectNetwork } from '../utils/web3';
import GameBoard from './GameBoard';
import GameLobby from './GameLobby';
import './Connect4Game.css';
import AboutPage from './AboutPage';
import HowToPlayPage from './HowToPlayPage';

function Connect4Game() {
  const [account, setAccount] = useState('');
  const [networkCorrect, setNetworkCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const [currentGameId, setCurrentGameId] = useState(null);
  const [currentPage, setCurrentPage] = useState('game'); // Options: 'game', 'about', 'howto'
  const [gameData, setGameData] = useState(null);
  const [availableGames, setAvailableGames] = useState([]);
  const [timeoutAvailable, setTimeoutAvailable] = useState(false);
  const [timeUntilTimeout, setTimeUntilTimeout] = useState(null);
  
  // Helper functions for dashboard
  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  const countPlayerPieces = (board, playerNumber) => {
    return board.filter(cell => cell === playerNumber).length;
  };

  const countPieces = (board) => {
    return board.filter(cell => cell !== 0).length;
  };

  const formatGameDuration = (lastMoveTime, timeout) => {
    // Calculate the game start time (when it was created)
    let gameStartTime = lastMoveTime;
    
    if (gameData && gameData.board && countPieces(gameData.board) > 0) {
      // If there are pieces on the board, calculate when the game actually started
      gameStartTime = lastMoveTime - timeout;
    }
    
    const durationSeconds = Math.floor(Date.now() / 1000) - gameStartTime;
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };
  
  // Initialize web3 connection and check network
  useEffect(() => {
    const init = async () => {
      try {
        if (!window.ethereum) {
          setError('MetaMask is not installed. Please install MetaMask to play Connect4.');
          setLoading(false);
          return;
        }
        
        // Check if on the correct network
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const isCorrect = await checkNetwork(provider);
        setNetworkCorrect(isCorrect);
        
        if (!isCorrect) {
          setError('Please connect to MegaETH network to play Connect4.');
          setLoading(false);
          return;
        }
        
        // Get account
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        
        // Load available games
        await loadAvailableGames();
        
        setLoading(false);
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize: ' + err.message);
        setLoading(false);
      }
    };
    
    init();
    
    // Set up event listeners for account and network changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0]);
      });
      
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);
  
  // Load game data when current game changes
useEffect(() => {
  if (currentGameId !== null) {
    loadGameData(currentGameId);
    
    const interval = setInterval(() => {
      loadGameData(currentGameId);
    }, 5000);
    
    return () => clearInterval(interval);
  }
}, [currentGameId]); // Remove loadGameData from here

  // This will update the timer more frequently than the game data
  useEffect(() => {
    if (currentGameId !== null && gameData && gameData.isActive && !timeoutAvailable) {
      // Update the timer every second
      const timerInterval = setInterval(() => {
        const currentTime = Math.floor(Date.now() / 1000);
        const timeoutTime = gameData.lastMoveTime + gameData.timeout;
        const remainingTime = timeoutTime - currentTime;
        
        setTimeUntilTimeout(remainingTime > 0 ? remainingTime : 0);
        if (remainingTime <= 0) {
          setTimeoutAvailable(true);
        }
      }, 1000);
      
      return () => clearInterval(timerInterval);
    }
  }, [currentGameId, gameData, timeoutAvailable]);

  
  // Load available games
  const loadAvailableGames = async () => {
    try {
      const contract = await getContractInstance();
      const games = await contract.getAvailableGames();
      setAvailableGames(games.map(g => g.toString()));
    } catch (err) {
      console.error('Error loading available games:', err);
      setError('Failed to load available games. Please try again.');
    }
  };

  // Add this helper function to update the timeout period in the message
const formatGameInfo = useCallback((infoString, timeoutValue) => {
  return infoString.replace(/Timeout period: \d+ seconds/, `Timeout period: ${timeoutValue} seconds`);
}, []);  // Empty dependency array as this doesn't depend on state/props
  
 const loadGameData = useCallback(async (gameId) => {
  try {
    const contract = await getContractInstance();
    
    // Get detailed game state
    const data = await contract.getGameState(gameId);
    const formattedData = formatGameData(data);
    
    // Calculate if timeout is available
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const timeoutTime = formattedData.lastMoveTime + formattedData.timeout;
    const remainingTime = timeoutTime - currentTime;
    
    setTimeoutAvailable(remainingTime <= 0);
    setTimeUntilTimeout(remainingTime > 0 ? remainingTime : 0);
    
    setGameData(formattedData);
    
    // Get game info (string representation)
    const info = await contract.getGameInfo(gameId);
    
    // Format the message to update the timeout period display
    const formattedInfo = formatGameInfo(info, formattedData.timeout);
    setMessage(formattedInfo);
  } catch (err) {
    console.error('Error loading game data:', err);
    setError('Failed to load game data. Please try again.');
  }
}, [formatGameInfo]);  // Add any dependencies used in this function
  
  
  // Create a new game
  const handleCreateGame = async (timeoutPeriod) => {
    try {
      setLoading(true);
      setMessage('Creating new game...');
      
      const contract = await getContractInstance();
      const tx = await contract.createGame(timeoutPeriod);
      setMessage('Transaction sent! Waiting for confirmation...');
      await tx.wait();
      
      setMessage('Game created! Getting game details...');
      
      // Get the gameCounter to find our newly created game
      const gameCounter = await contract.gameCounter();
      const newGameId = gameCounter.toNumber() - 1;
      
      setCurrentGameId(newGameId);
      loadGameData(newGameId);
      setLoading(false);
      setMessage(`Game #${newGameId} created successfully!`);
    } catch (err) {
      console.error('Error creating game:', err);
      setError('Failed to create game: ' + err.message);
      setLoading(false);
    }
  };
  
  // Join an existing game
  const handleJoinGame = async (gameId) => {
    try {
      setLoading(true);
      setMessage(`Joining game #${gameId}...`);
      
      const contract = await getContractInstance();
      const tx = await contract.joinGame(gameId);
      setMessage('Transaction sent! Waiting for confirmation...');
      await tx.wait();
      
      setCurrentGameId(gameId);
      loadGameData(gameId);
      setLoading(false);
      setMessage(`Successfully joined game #${gameId}!`);
    } catch (err) {
      console.error('Error joining game:', err);
      setError('Failed to join game: ' + err.message);
      setLoading(false);
    }
  };
  
  // Auto matchmaking
  const handleAutoMatchmaking = async (timeoutPeriod) => {
    try {
      setLoading(true);
      setMessage('Finding a game...');
      
      const contract = await getContractInstance();
      const tx = await contract.autoMatchmaking(timeoutPeriod);
      setMessage('Transaction sent! Waiting for confirmation...');
      const receipt = await tx.wait();
      
      // Parse events to find the game ID
      let gameId = null;
      for (const event of receipt.events) {
        if (event.event === 'GameCreated' || event.event === 'PlayerJoined') {
          gameId = event.args.gameID.toString();
          break;
        }
      }
      
      if (gameId === null) {
        // If we can't find the game ID from events, get the latest game counter
        const gameCounter = await contract.gameCounter();
        gameId = (gameCounter.toNumber() - 1).toString();
      }
      
      setCurrentGameId(gameId);
      loadGameData(gameId);
      setLoading(false);
      setMessage(`Auto-matched to game #${gameId}!`);
    } catch (err) {
      console.error('Error in auto matchmaking:', err);
      setError('Failed to find a game: ' + err.message);
      setLoading(false);
    }
  };

const handleCleanupTimedOutGames = async () => {
  try {
    setLoading(true);
    setMessage('Cleaning up timed out games...');
    
    const contract = await getContractInstance();
    const tx = await contract.cleanupTimedOutGames();
    setMessage("Transaction sent! Waiting for confirmation...");
    await tx.wait();
    
    setMessage("Successfully cleaned up timed out games!");
    
    // Reload game data if we're in a game
    if (currentGameId !== null) {
      loadGameData(currentGameId);
    } else {
      // If in lobby, refresh available games
      loadAvailableGames();
    }
    
    setLoading(false);
  } catch (err) {
    console.error('Error cleaning up timed out games:', err);
    setError('Failed to clean up timed out games: ' + err.message);
    setLoading(false);
  }
};
  
  // Make a move
  const handleMakeMove = async (column) => {
    try {
      setLoading(true);
      setMessage(`Making move in column ${column}...`);
      
      const contract = await getContractInstance();
      const tx = await contract.makeMove(currentGameId, column);
      setMessage("Move submitted! Waiting for confirmation...");
      await tx.wait();
      setMessage("Move confirmed!");
      
      loadGameData(currentGameId);
      setLoading(false);
    } catch (err) {
      console.error('Error making move:', err);
      setError('Failed to make move: ' + err.message);
      setLoading(false);
    }
  };
  
  // Return to lobby
  const handleReturnToLobby = () => {
    setCurrentGameId(null);
    setGameData(null);
    loadAvailableGames();
  };
  
  // Update the handleCheckTimeout function
  const handleCheckTimeout = async () => {
    try {
      setLoading(true);
      setMessage('Checking for timeout...');
      
      const contract = await getContractInstance();
      
      // Only try if timeout is available
      if (timeoutAvailable) {
        const tx = await contract.checkTimeout(currentGameId);
        setMessage("Transaction sent! Waiting for confirmation...");
        await tx.wait();
        setMessage('Timeout check successful! Game has timed out.');
      } else {
        setError(`The timeout period has not been reached yet. Please wait ${Math.floor(timeUntilTimeout / 60)}m ${timeUntilTimeout % 60}s more.`);
        setLoading(false);
        return;
      }
      
      loadGameData(currentGameId);
      setLoading(false);
    } catch (err) {
      console.error('Error checking timeout:', err);
      
      // Check for specific timeout error
      if (err.message.includes('Timeout period not reached')) {
        setError('The timeout period has not been reached yet. Please wait longer.');
      } else {
        setError('Failed to check timeout: ' + err.message);
      }
      
      setLoading(false);
    }
  };
  
  // Switch network
  const handleSwitchNetwork = async () => {
    const success = await switchToCorrectNetwork();
    if (success) {
      window.location.reload();
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="connect4-container">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>{message || 'Loading...'}</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="connect4-container">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          {!networkCorrect && (
            <button onClick={handleSwitchNetwork}>Switch to MegaETH Network</button>
          )}
          <button onClick={() => setError('')}>Dismiss</button>
        </div>
      </div>
    );
  }
  
  // Render game view or lobby based on current state
  return (
    <div className="connect4-container">
      {currentPage === 'game' ? (
        <>
          <div className="header">
  <div className="title-section">
    <h1 className="main-title">Genesis V.'s Blockchain Connect 4 Extravaganza</h1>
    <div className="subtitle">CS596 Final Project - Prof. Li</div>
  </div>
  <div className="nav-links">
    <button 
      onClick={() => setCurrentPage('about')} 
      className="nav-link"
    >
      About
    </button>
    <button 
      onClick={() => setCurrentPage('howto')} 
      className="nav-link"
    >
      How to Play
    </button>
  </div>
  <div className="account-info">
    Connected: {account ? `${account.substring(0, 6)}...${account.substring(38)}` : 'Not connected'}
  </div>
</div>
          
          {message && (
            <div className="message-bar">
              {message}
              <button className="close-button" onClick={() => setMessage('')}>×</button>
            </div>
          )}
          
          {currentGameId === null ? (
            // Render lobby when not in a game
            <GameLobby 
  onCreateGame={handleCreateGame}
  onJoinGame={handleJoinGame}
  onAutoMatchmaking={handleAutoMatchmaking}
  availableGames={availableGames}
  onCleanupTimedOutGames={handleCleanupTimedOutGames}
/>
          ) : (
            // Render game when in a game
            <div className="game-container">
              <div className="game-controls">
                <h2>
                  {gameData && !gameData.isActive && gameData.winner !== '0x0000000000000000000000000000000000000000' ? 
                    `Game #${currentGameId} - ${gameData.winner.toLowerCase() === account.toLowerCase() ? 'You Won!' : 'You Lost!'}` : 
                    `Game #${currentGameId}`}
                </h2>
              </div>
              
              {gameData && (
                <div className="game-dashboard">
                  <h3>Game Dashboard</h3>
                  
                  <div className="dashboard-section players-section">
                    <h4>Players</h4>
                    <div className="player-row">
                      <div className="player-chip player1"></div>
                      <div className="player-info">
                        <div className="player-role">
                          Player 1 {account.toLowerCase() === gameData.player1.toLowerCase() ? "(You)" : ""}
                        </div>
                        <div className="player-address">{formatAddress(gameData.player1)}</div>
                      </div>
                      <div className="piece-count">{countPlayerPieces(gameData.board, 1)} pieces</div>
                    </div>
                    <div className="player-row">
                      <div className="player-chip player2"></div>
                      <div className="player-info">
                        <div className="player-role">
                          Player 2 {account.toLowerCase() === gameData.player2.toLowerCase() ? "(You)" : ""}
                        </div>
                        <div className="player-address">
                          {gameData.player2 !== '0x0000000000000000000000000000000000000000' ? 
                            formatAddress(gameData.player2) : 'Waiting for player...'}
                        </div>
                      </div>
                      <div className="piece-count">{countPlayerPieces(gameData.board, 2)} pieces</div>
                    </div>
                  </div>
                  
                  <div className="dashboard-section timing-section">
                    <h4>Game Timing</h4>
                    <div className="info-row">
                      <span>Created:</span>
                      <span>{new Date(gameData.lastMoveTime * 1000 - gameData.timeout * 1000).toLocaleTimeString()}</span>
                    </div>
                    <div className="info-row">
                      <span>Last Move:</span>
                      <span>{new Date(gameData.lastMoveTime * 1000).toLocaleTimeString()}</span>
                    </div>
                    <div className="info-row">
                      <span>Game Duration:</span>
                      <span>{formatGameDuration(gameData.lastMoveTime, gameData.timeout)}</span>
                    </div>
                  </div>
                  
                  <div className="dashboard-section game-state">
                    <h4>Game State</h4>
                    <div className="state-indicator">
                      {!gameData.isActive ? (
                        <span className="game-ended">Game Ended</span>
                      ) : gameData.player2 === '0x0000000000000000000000000000000000000000' ? (
                        <span className="waiting">Waiting for Opponent</span>
                      ) : gameData.currentPlayer.toLowerCase() === account.toLowerCase() ? (
                        <span className="your-turn">Your Turn</span>
                      ) : (
                        <span className="opponent-turn">Opponent's Turn</span>
                      )}
                    </div>
                    <div className="moves-made">
                      Total Moves: {countPieces(gameData.board)}
                    </div>
                    
                    {gameData.isActive && (
                      <div className="timeout-info dashboard-timeout">
                        {timeoutAvailable ? (
                          <button onClick={handleCheckTimeout} className="timeout-button available">
                            Claim Win by Timeout
                          </button>
                        ) : (
                          <div>
                            <div className="timeout-progress">
                              <div className="timeout-label">Time until timeout:</div>
                              <div className="timeout-value">{Math.floor(timeUntilTimeout / 60)}m {timeUntilTimeout % 60}s</div>
                            </div>
                            <div className="timeout-bar-container">
                              <div 
                                className="timeout-bar" 
                                style={{ 
                                  width: `${(1 - timeUntilTimeout / gameData.timeout) * 100}%`,
                                  backgroundColor: timeUntilTimeout < 60 ? '#e74c3c' : '#3498db'
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="button-container">
                    <button onClick={handleReturnToLobby}>Return to Lobby</button>
                  </div>
                </div>
              )}
              
              {gameData && (
                <GameBoard 
                  gameId={currentGameId}
                  board={gameData.board}
                  currentPlayer={gameData.currentPlayer}
                  myAddress={account}
                  onMakeMove={handleMakeMove}
                  isActive={gameData.isActive}
                  gameData={gameData}
                />
              )}
            </div>
          )}
        </>
      ) : currentPage === 'about' ? (
        <AboutPage onBack={() => setCurrentPage('game')} />
      ) : (
        <HowToPlayPage onBack={() => setCurrentPage('game')} />
      )}
    </div>
  );
}

export default Connect4Game;