// src/components/HowToPlayPage.js
import React from 'react';
import './HowToPlayPage.css';

function HowToPlayPage({ onBack }) {
  return (
    <div className="howto-container">
      <h1>How to Play Blockchain Connect4</h1>
      
      <div className="howto-section">
        <h2>Game Overview</h2>
        <p>
          Connect4 is a classic two-player connection game where players take turns dropping colored discs
          into a vertically suspended 7×6 grid. The objective is to be the first to form a horizontal, 
          vertical, or diagonal line of four of one's own discs.
        </p>
        <p>
          This blockchain version maintains all the rules of the traditional game, with the added security 
          and transparency of blockchain technology.
        </p>
      </div>

      <div className="howto-section">
        <h2>Getting Started</h2>
        <h3>Prerequisites:</h3>
        <ul>
          <li>MetaMask wallet installed in your browser</li>
          <li>MegaETH testnet configured in your MetaMask (Chain ID: 6342)</li>
          <li>Some MegaETH tokens for gas fees</li>
        </ul>
        <h3>Connect Your Wallet:</h3>
        <p>
          When you open the game, it will automatically prompt you to connect your MetaMask wallet. 
          Make sure you're on the MegaETH testnet.
        </p>
      </div>

      <div className="howto-section">
        <h2>Playing the Game</h2>
        <h3>Creating a Game:</h3>
        <ol>
          <li>From the lobby screen, set your desired timeout period (minimum 60 seconds)</li>
          <li>Click "Create Game" to start a new game</li>
          <li>Wait for an opponent to join, or share your game ID with a friend</li>
        </ol>
        
        <h3>Joining a Game:</h3>
        <ol>
          <li>From the lobby screen, you'll see a list of available games</li>
          <li>Click "Join" next to any available game</li>
          <li>You can also use "Auto Matchmaking" to join an existing game or create a new one</li>
        </ol>
        
        <h3>Making Moves:</h3>
        <ol>
          <li>When it's your turn, the column buttons will be active</li>
          <li>Click on a column to drop your disc</li>
          <li>Wait for your move to be confirmed on the blockchain</li>
          <li>The game will automatically update when your opponent makes a move</li>
        </ol>
      </div>

      <div className="howto-section">
        <h2>Game Features</h2>
        <h3>Game Dashboard:</h3>
        <p>
          The dashboard shows important information about the current game:
        </p>
        <ul>
          <li>Player information and piece counts</li>
          <li>Game timing (creation time, last move, game duration)</li>
          <li>Game state (whose turn, waiting for opponent, game ended)</li>
          <li>Timeout information and progress</li>
        </ul>
        
        <h3>Timeout Mechanism:</h3>
        <p>
          If your opponent doesn't make a move within the timeout period:
        </p>
        <ol>
          <li>The timeout bar will fill completely</li>
          <li>A "Claim Win by Timeout" button will appear</li>
          <li>Click this button to claim your win due to opponent inactivity</li>
        </ol>
      </div>

      <div className="howto-section">
        <h2>Winning the Game</h2>
        <p>
          The game can end in three ways:
        </p>
        <ol>
          <li><strong>Connect Four</strong>: Successfully connect four of your discs in a row (horizontally, vertically, or diagonally)</li>
          <li><strong>Timeout Win</strong>: Your opponent fails to make a move within the timeout period</li>
          <li><strong>Draw</strong>: The board is filled completely with no four-in-a-row formed</li>
        </ol>
      </div>

      <div className="howto-section">
        <h2>Blockchain Aspects</h2>
        <p>
          Unlike traditional online games, this blockchain implementation has unique characteristics:
        </p>
        <ul>
          <li>Each move requires a blockchain transaction and gas fee</li>
          <li>Transactions need time to be mined (usually 5-30 seconds)</li>
          <li>All game rules are enforced by the smart contract, not a central server</li>
          <li>Game history is permanently recorded on the blockchain</li>
          <li>The game state cannot be manipulated or hacked</li>
        </ul>
      </div>

      <button className="back-button" onClick={onBack}>
        Back to Game
      </button>
    </div>
  );
}

export default HowToPlayPage;