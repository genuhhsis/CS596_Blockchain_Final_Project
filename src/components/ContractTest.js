import React, { useState, useEffect } from 'react';
import { getContractInstance, getWeb3Provider, checkNetwork, switchToSepolia } from '../utils/web3';

function ContractTest() {
  const [accounts, setAccounts] = useState([]);
  const [gameCounter, setGameCounter] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [networkCorrect, setNetworkCorrect] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Check if MetaMask is installed
        if (!window.ethereum) {
          setError('MetaMask is not installed. Please install MetaMask to use this application.');
          setLoading(false);
          return;
        }
        
        // Get provider
        const provider = await getWeb3Provider();
        
        // Check network
        const isCorrectNetwork = await checkNetwork(provider);
        setNetworkCorrect(isCorrectNetwork);
        
        if (!isCorrectNetwork) {
          setError('Please connect to Sepolia test network');
          setLoading(false);
          return;
        }
        
        // Get accounts
        const accs = await provider.listAccounts();
        setAccounts(accs);
        
        // Get contract instance
        const contract = await getContractInstance();
        
        // Call contract method
        const count = await contract.gameCounter();
        setGameCounter(count.toNumber());
        
        setLoading(false);
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    init();
  }, []);

  const handleSwitchNetwork = async () => {
    const success = await switchToSepolia();
    if (success) {
      setNetworkCorrect(true);
      setError('');
      // Reinitialize
      setLoading(true);
      const provider = await getWeb3Provider();
      const accs = await provider.listAccounts();
      setAccounts(accs);
      const contract = await getContractInstance();
      const count = await contract.gameCounter();
      setGameCounter(count.toNumber());
      setLoading(false);
    }
  };

  const createGame = async () => {
    try {
      setLoading(true);
      const contract = await getContractInstance();
      const tx = await contract.createGame(300); // 5 minutes timeout
      await tx.wait();
      // Update game counter
      const count = await contract.gameCounter();
      setGameCounter(count.toNumber());
      setLoading(false);
      alert('Game created successfully!');
    } catch (err) {
      console.error('Error creating game:', err);
      setError('Error creating game: ' + err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!networkCorrect) {
    return (
      <div>
        <h2>Wrong Network</h2>
        <p>Please connect to Sepolia test network to use this application.</p>
        <button onClick={handleSwitchNetwork}>Switch to Sepolia</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Contract Connection Test</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>Connected Account: {accounts[0]}</p>
      <p>Game Counter: {gameCounter}</p>
      <button onClick={createGame}>Create New Game</button>
    </div>
  );
}

export default ContractTest;