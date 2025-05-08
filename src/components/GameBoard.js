import React, { useState, useEffect } from 'react';
import './GameBoard.css';

function GameBoard({ gameId, board, currentPlayer, myAddress, onMakeMove, isActive, gameData }) {
  // Add state to track new pieces, winning pieces and last column
  const [newPiecePosition, setNewPiecePosition] = useState(null);
  const [winningPositions, setWinningPositions] = useState([]);
  const [previousBoard, setPreviousBoard] = useState(Array(42).fill(0));
  const [lastSelectedColumn, setLastSelectedColumn] = useState(null);
  const [showBlockchainNote, setShowBlockchainNote] = useState(true);
  
  // When the board changes, identify the new piece
  useEffect(() => {
    if (previousBoard && board) {
      // Find the position that changed
      for (let i = 0; i < board.length; i++) {
        if (board[i] !== 0 && previousBoard[i] === 0) {
          setNewPiecePosition(i);
          // Calculate the column from the index (i % 7)
          setLastSelectedColumn(i % 7);
          
          // Reset the new piece position after the animation duration
          const timer = setTimeout(() => {
            setNewPiecePosition(null);
          }, 500); // Match this to your animation duration
          
          // Reset the column highlight after a longer duration
          const columnTimer = setTimeout(() => {
            setLastSelectedColumn(null);
          }, 2000); // Keep column highlighted longer
          
          return () => {
            clearTimeout(timer);
            clearTimeout(columnTimer);
          };
        }
      }
    }
    // Update previous board for next comparison
    setPreviousBoard([...board]);
  }, [board, previousBoard]);
  
  // Check if game just ended and find winning positions
  useEffect(() => {
    if (gameData && !gameData.isActive && gameData.winner !== '0x0000000000000000000000000000000000000000') {
      // Determine winning positions (this is a simplified example - you'd need proper win detection)
      const possibleWinningPositions = findWinningPositions(board);
      setWinningPositions(possibleWinningPositions);
    } else {
      setWinningPositions([]);
    }
  }, [gameData, board]);
  
  // Function to find winning positions
  const findWinningPositions = (board) => {
    // Horizontal wins
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        const idx = row * 7 + col;
        const player = board[idx];
        
        if (player !== 0 && 
            player === board[idx + 1] && 
            player === board[idx + 2] && 
            player === board[idx + 3]) {
          return [idx, idx + 1, idx + 2, idx + 3];
        }
      }
    }
    
    // Vertical wins
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 7; col++) {
        const idx = row * 7 + col;
        const player = board[idx];
        
        if (player !== 0 && 
            player === board[idx + 7] && 
            player === board[idx + 14] && 
            player === board[idx + 21]) {
          return [idx, idx + 7, idx + 14, idx + 21];
        }
      }
    }
    
    // Diagonal wins (bottom-left to top-right)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const idx = row * 7 + col;
        const player = board[idx];
        
        if (player !== 0 && 
            player === board[idx + 8] && 
            player === board[idx + 16] && 
            player === board[idx + 24]) {
          return [idx, idx + 8, idx + 16, idx + 24];
        }
      }
    }
    
    // Diagonal wins (top-left to bottom-right)
    for (let row = 3; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
        const idx = row * 7 + col;
        const player = board[idx];
        
        if (player !== 0 && 
            player === board[idx - 6] && 
            player === board[idx - 12] && 
            player === board[idx - 18]) {
          return [idx, idx - 6, idx - 12, idx - 18];
        }
      }
    }
    
    return [];
  };

  const renderCell = (value, rowIndex, colIndex) => {
    const cellIndex = rowIndex * 7 + colIndex;
    let cellClass = "cell";
    
    if (value === 1) cellClass += " player1";
    if (value === 2) cellClass += " player2";
    
    // Add animation classes
    if (cellIndex === newPiecePosition) {
      cellClass += " new-piece";
    }
    
    // Highlight the column
    if (colIndex === lastSelectedColumn) {
      cellClass += " highlighted-column";
    }
    
    if (winningPositions.includes(cellIndex)) {
      cellClass += " winning-piece";
    }
    
    return (
      <div 
        key={`${rowIndex}-${colIndex}`} 
        className={cellClass}
      />
    );
  };
  
  const getGrid = () => {
    const grid = [];
    for (let row = 5; row >= 0; row--) {
      const currentRow = [];
      for (let col = 0; col < 7; col++) {
        currentRow.push(board[row * 7 + col]);
      }
      grid.push(currentRow);
    }
    return grid;
  };

  const handleColumnClick = (colIndex) => {
    if (isActive && currentPlayer.toLowerCase() === myAddress.toLowerCase()) {
      // Update the last selected column
      setLastSelectedColumn(colIndex);
      onMakeMove(colIndex);
    }
  };

  const grid = getGrid();
  const isMyTurn = currentPlayer.toLowerCase() === myAddress.toLowerCase();
  
  // Determine player number based on address match
  const getPlayerNumber = () => {
    if (gameData && gameData.player1 && gameData.player2) {
      if (myAddress.toLowerCase() === gameData.player1.toLowerCase()) {
        return 1;
      } else if (myAddress.toLowerCase() === gameData.player2.toLowerCase()) {
        return 2;
      }
    }
    // Fallback detection
    return isMyTurn ? 1 : 2;
  };
  
  const playerNumber = getPlayerNumber();

  return (
    <div className="game-board-container">
      <div className="player-indicator">
        <div className="player-info">
          <p>You are Player {playerNumber}</p>
          <div className={`player-piece player${playerNumber}`}></div>
        </div>
        <div className="turn-status">
          {isActive ? (isMyTurn ? "Your Turn" : "Opponent's Turn") : "Game Over"}
        </div>
        
        {/* Blockchain transaction note */}
        {showBlockchainNote && (
          <div className="blockchain-note">
            <div className="note-header">
              <h4>Blockchain Info</h4>
              <button className="close-note" onClick={() => setShowBlockchainNote(false)}>×</button>
            </div>
            <p>Please note that delays may occur:</p>
            <ul>
              <li>Each move requires a blockchain transaction and gas fee</li>
              <li>Transactions need time to be mined (usually 5-30 seconds)</li>
            </ul>
          </div>
        )}
      </div>
    
      <div className="game-board">
        <div className="column-buttons">
          {[0, 1, 2, 3, 4, 5, 6].map(col => (
            <button 
              key={col} 
              onClick={() => handleColumnClick(col)}
              disabled={!isActive || !isMyTurn}
              className={`column-button ${isActive && isMyTurn ? 'active' : ''} ${col === lastSelectedColumn ? 'last-selected' : ''}`}
            >
              ↓
            </button>
          ))}
        </div>
        
        <div className="grid">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="row">
              {row.map((cell, colIndex) => (
                renderCell(cell, rowIndex, colIndex)
              ))}
            </div>
          ))}
        </div>
        
        <div className="game-id">Game #{gameId}</div>
      </div>
    </div>
  );
}

export default GameBoard;