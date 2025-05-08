import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Connect4GameABI from '../contracts/Connect4Game.json';

function MegaTest() {
  const [logs, setLogs] = useState([]);
  const [networkInfo, setNetworkInfo] = useState({});
  const [account, setAccount] = useState('');
  const [contractData, setContractData] = useState(null);
  
  const CONTRACT_ADDRESS = '0x29a269fa7e0f71367c2b4e1355e79bffa1632be7';
  
  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };
  
  useEffect(() => {
    const init = async () => {
      addLog("Starting MegaETH connection test...");
      
      // Check if MetaMask is installed
      if (!window.ethereum) {
        addLog("ERROR: MetaMask not detected!");
        return;
      }
      
      try {
        // Get network details
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const chainIdDecimal = parseInt(chainId, 16);
        addLog(`Connected to Chain ID: ${chainIdDecimal} (0x${chainId.substring(2)})`);
        
        if (chainIdDecimal !== 6342) {
          addLog("ERROR: Not connected to MegaETH (Chain ID 6342)!");
          addLog("Attempting to switch networks...");
          
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x18c6' }], // 0x18c6 is hex for 6342
            });
            addLog("Successfully switched to MegaETH!");
            
            // Get chain ID again to verify
            const newChainId = await window.ethereum.request({ method: 'eth_chainId' });
            addLog(`Now connected to Chain ID: ${parseInt(newChainId, 16)}`);
          } catch (switchError) {
            addLog(`Failed to switch networks: ${switchError.message}`);
            
            // If the network doesn't exist in MetaMask, try to add it
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x18c6',
                    chainName: 'MegaETH Testnet',
                    nativeCurrency: {
                      name: 'MEGA',
                      symbol: 'MEGA',
                      decimals: 18
                    },
                    rpcUrls: ['https://carrot.megaeth.com/rpc'],
                    blockExplorerUrls: ['https://megaexplorer.xyz']
                  }]
                });
                addLog("MegaETH network added to MetaMask!");
              } catch (addError) {
                addLog(`Failed to add MegaETH network: ${addError.message}`);
                return;
              }
            } else {
              return;
            }
          }
        }
        
        // Request accounts
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const connectedAccount = accounts[0];
        setAccount(connectedAccount);
        addLog(`Connected to account: ${connectedAccount}`);
        
        // Create ethers provider
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        setNetworkInfo({
          name: network.name,
          chainId: network.chainId,
          ensAddress: network.ensAddress || 'None'
        });
        addLog(`Ethers connected to: ${network.name} (${network.chainId})`);
        
        // Get contract instance
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, Connect4GameABI, signer);
        addLog("Contract instance created");
        
        // Try to call gameCounter
        try {
          addLog("Calling gameCounter()...");
          const result = await contract.gameCounter();
          addLog(`gameCounter success! Value: ${result.toString()}`);
          
          setContractData(prev => ({
            ...prev,
            gameCounter: result.toString()
          }));
        } catch (callError) {
          addLog(`ERROR calling gameCounter: ${callError.message}`);
          
          // Try calling with a different method
          try {
            addLog("Trying alternative method...");
            const callData = ethers.utils.id("gameCounter()").slice(0, 10);
            const callResult = await provider.call({
              to: CONTRACT_ADDRESS,
              data: callData
            });
            
            if (callResult && callResult !== '0x') {
              const decoded = ethers.utils.defaultAbiCoder.decode(['uint256'], callResult);
              addLog(`Alternative call succeeded! Value: ${decoded[0].toString()}`);
            } else {
              addLog("Alternative call returned empty result");
            }
          } catch (altError) {
            addLog(`Alternative method failed: ${altError.message}`);
          }
        }
        
        // Try to call getAvailableGames
        try {
          addLog("Calling getAvailableGames()...");
          const games = await contract.getAvailableGames();
          addLog(`getAvailableGames success! Found ${games.length} games`);
          
          setContractData(prev => ({
            ...prev,
            availableGames: games.map(g => g.toString())
          }));
        } catch (callError) {
          addLog(`ERROR calling getAvailableGames: ${callError.message}`);
        }
        
        // Check if contract exists by getting the bytecode
        try {
          addLog("Checking contract bytecode...");
          const bytecode = await provider.getCode(CONTRACT_ADDRESS);
          
          if (bytecode === '0x') {
            addLog("ERROR: No contract bytecode found at this address!");
          } else {
            const byteLength = (bytecode.length - 2) / 2; // -2 for '0x' and /2 for hex
            addLog(`Contract bytecode exists! Length: ${byteLength} bytes`);
          }
        } catch (codeError) {
          addLog(`ERROR checking contract code: ${codeError.message}`);
        }
        
      } catch (error) {
        addLog(`ERROR in initialization: ${error.message}`);
      }
    };
    
    init();
  }, []);
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>MegaETH Network Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Network Information</h3>
        <p><strong>Connected Account:</strong> {account || 'Not connected'}</p>
        <p><strong>Network Name:</strong> {networkInfo.name || 'Unknown'}</p>
        <p><strong>Chain ID:</strong> {networkInfo.chainId || 'Unknown'}</p>
        <p><strong>Contract Address:</strong> {CONTRACT_ADDRESS}</p>
      </div>
      
      {contractData && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Contract Data</h3>
          <p><strong>Game Counter:</strong> {contractData.gameCounter || 'Not available'}</p>
          <p><strong>Available Games:</strong> {contractData.availableGames ? 
            (contractData.availableGames.length > 0 ? contractData.availableGames.join(', ') : 'None') : 
            'Not available'}</p>
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Debug Logs</h3>
        <div style={{ 
          backgroundColor: '#f0f0f0', 
          padding: '10px', 
          maxHeight: '300px', 
          overflowY: 'auto', 
          fontFamily: 'monospace',
          fontSize: '14px',
          whiteSpace: 'pre-wrap',
          borderRadius: '4px'
        }}>
          {logs.map((log, index) => (
            <div key={index} style={{ 
              color: log.includes('ERROR') ? 'red' : 
                     log.includes('success') ? 'green' : 'black',
              marginBottom: '2px'
            }}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MegaTest;