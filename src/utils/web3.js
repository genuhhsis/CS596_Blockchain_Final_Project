import { ethers } from 'ethers';
import Connect4GameABI from '../contracts/Connect4Game.json';

// Your deployed contract address on Sepolia
export const CONTRACT_ADDRESS = '0x356fC17583D9A3a773C90E35668941154fD16176';

// Connect to provider (MetaMask)
export const getWeb3Provider = async () => {
  if (window.ethereum) {
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      return new ethers.providers.Web3Provider(window.ethereum);
    } catch (error) {
      throw new Error('User denied account access');
    }
  } else {
    throw new Error('MetaMask is not installed. Please install MetaMask to use this application.');
  }
};

// Get contract instance
export const getContractInstance = async () => {
  const provider = await getWeb3Provider();
  const signer = provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, Connect4GameABI, signer);
};

// Helper function to format game data
export const formatGameData = (gameData) => {
  return {
    player1: gameData.player1,
    player2: gameData.player2,
    currentPlayer: gameData.currentPlayer,
    winner: gameData.winner,
    board: gameData.board.map(b => Number(b)),  // Convert BigNumber to Number
    isActive: gameData.isActive,
    lastMoveTime: Number(gameData.lastMoveTime),
    timeout: Number(gameData.timeout)
  };
};

// Check if user is connected to the correct network
export const checkNetwork = async (provider) => {
  const network = await provider.getNetwork();
  // Sepolia chain ID is 6342
  return network.chainId === 6342;
};

// Switch to the correct network if needed
export const switchToCorrectNetwork = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x18c6' }], // 0x18c6 is hex for 6342
    });
    return true;
  } catch (error) {
    console.error("Failed to switch network:", error);
    return false;
  }
};