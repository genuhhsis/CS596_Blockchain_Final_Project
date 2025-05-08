// src/components/AboutPage.js
import React from 'react';
import './AboutPage.css';

function AboutPage({ onBack }) {
  return (
    <div className="about-container">
      <h1>About Blockchain Connect4</h1>
      
      <div className="about-section">
        <h2>Project Overview</h2>
        <p>
          This decentralized Connect4 game is my final project for CS596: Fundamentals of Cryptography with 
          Applications to Blockchain, taught by Professor Li at San Diego State University.
        </p>
        <p>
          By implementing this classic game on the blockchain, I've created a fully transparent, 
          decentralized gaming experience that demonstrates the power of smart contracts for 
          trustless interaction between players.
        </p>
      </div>

      <div className="about-section">
        <h2>Technology & Implementation</h2>
        <p>
          This application consists of two main components:
        </p>
        <ul>
          <li>
            <strong>Smart Contract (Backend)</strong>: Written in Solidity and deployed on the MegaETH 
            testnet at address <code>0x12d7c64faC971734a1BF39cD4Ba03e02Efa564B9</code>, the contract 
            handles all game logic, state management, player turns, win conditions, and timeout mechanisms.
          </li>
          <li>
            <strong>React Application (Frontend)</strong>: Built using React.js and ethers.js, the frontend 
            provides an intuitive interface to interact with the blockchain, visualize the game state, and 
            manage player interactions.
          </li>
        </ul>
        <p>
          The smart contract uses a 7x6 grid represented as a flattened array for gas efficiency. It implements 
          player matchmaking, validates game moves, checks win conditions across horizontal, vertical, and diagonal 
          lines, and provides timeout mechanisms to handle inactive players.
        </p>
      </div>

      <div className="about-section">
        <h2>Why Blockchain for Gaming?</h2>
        <p>
          Traditional online games often rely on centralized servers, making them vulnerable to downtime, 
          hacking, or censorship. Blockchain technology addresses these limitations by offering:
        </p>
        <ul>
          <li><strong>Decentralization</strong>: No single point of failure or control</li>
          <li><strong>Transparency</strong>: All game rules and outcomes are visible and verifiable</li>
          <li><strong>Immutability</strong>: Game history cannot be altered once recorded</li>
          <li><strong>Trustless Interaction</strong>: No need to trust a central authority</li>
        </ul>
        <p>
          This implementation demonstrates how even simple games can benefit from blockchain technology, 
          creating new possibilities for fair, transparent, and global gaming experiences.
        </p>
      </div>

      <div className="about-section">
        <h2>Personal Motivation</h2>
        <p>
          I chose to pursue this project because I have a passion for both gaming and emerging technologies. 
          While blockchain and cryptocurrency are often treated as buzzwords, I wanted to develop a deeper 
          understanding of how these technologies actually work.
        </p>
        <p>
          As a Computer Science student at San Diego State University, I'm excited to continue learning and 
          developing my skills at the intersection of gaming and blockchain. After working on this project 
          for 2-3 months, I've gained a newfound appreciation for the ingenuity behind blockchain technology 
          and the potential it holds for future applications.
        </p>
      </div>

      <div className="about-section">
        <h2>Current Implementation</h2>
        <p>
          The current version runs on the MegaETH testnet (Chain ID: 6342). To play the game:
        </p>
        <ul>
          <li>You'll need MetaMask with some MegaETH testnet tokens</li>
          <li>Two different accounts are required to play a complete game</li>
          <li>The contract is deployed at address: <code>0x12d7c64faC971734a1BF39cD4Ba03e02Efa564B9</code></li>
        </ul>
      </div>

      <div className="about-section">
        <h2>About the Developer</h2>
        <p>
          I'm Genesis Anne Villar, a 4th year Undergraduate Computer Science student at San Diego State University with a passion for 
          gaming and innovative technologies. I'm constantly looking to expand my skillset and explore new 
          applications of emerging technologies.
        </p>
        <p>
          You can find more of my projects on my GitHub:
        </p>
        <p className="github-link">
          <a href="https://github.com/genuhhsis" target="_blank" rel="noopener noreferrer">
            github.com/genuhhsis
          </a>
        </p>
      </div>

      <button className="back-button" onClick={onBack}>
        Back to Game
      </button>
    </div>
  );
}

export default AboutPage;