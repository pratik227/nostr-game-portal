import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { RefreshCwIcon, UserIcon as BrowserIcon, KeyIcon, AlertTriangleIcon, TrophyIcon, EqualIcon, RotateCcwIcon, LogOutIcon, ShareIcon, WifiIcon, WifiOffIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react'; // Assuming lucide-react is installed
import { bytesToHex } from '@noble/hashes/utils';
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure';
import { SimplePool } from 'nostr-tools/pool';
import { decode } from 'nostr-tools/nip19';

// Import your CSS file
import './NostrTicTacToe.css';

const NostrTicTacToe = ({ onScoreUpdate, onGameOver }) => { // Props for emits
  // Game State (useState equivalents of Vue refs)
  const [relayUrl, setRelayUrl] = useState('wss://relay.damus.io'); [cite: 32]
  const [gameId, setGameId] = useState(''); [cite: 32]
  const [gameStarted, setGameStarted] = useState(false); [cite: 32]
  const [loginMethod, setLoginMethod] = useState('extension'); [cite: 32]
  const [nsec, setNsec] = useState(''); [cite: 32]
  const [loading, setLoading] = useState(false); [cite: 32]
  const [isConnected, setIsConnected] = useState(false); [cite: 32]

  // Nostr Connection (using useRef for mutable values that don't trigger re-renders, or useState if they do)
  const pool = useMemo(() => new SimplePool(), []); [cite: 31] // Memoize the pool instance
  const subRef = useRef(null); // useRef for the subscription object
  const pubkeyRef = useRef(null);
  const secretKeyRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Game Logic State
  const [board, setBoard] = useState(Array(9).fill(null)); [cite: 32]
  const [currentPlayer, setCurrentPlayer] = useState('X'); [cite: 32]
  const [winner, setWinner] = useState(null); [cite: 32]
  const [winningCells, setWinningCells] = useState([]); [cite: 32]
  const [gameStateVersion, setGameStateVersion] = useState(0); [cite: 32]
  const [xWins, setXWins] = useState(0); [cite: 32]
  const [oWins, setOWins] = useState(0); [cite: 32]
  const [isMyTurn, setIsMyTurn] = useState(true); [cite: 32]
  const [playerX, setPlayerX] = useState(null); [cite: 32]
  const [playerO, setPlayerO] = useState(null); [cite: 32]
  const [gameReady, setGameReady] = useState(false); [cite: 32]
  const [creatorPubkey, setCreatorPubkey] = useState(null); [cite: 32]

  // UI State for Toast
  const [showConnectionToast, setShowConnectionToast] = useState(false); [cite: 32]
  const [connectionToastMessage, setConnectionToastMessage] = useState(''); [cite: 32]
  const [connectionToastType, setConnectionToastType] = useState('info'); [cite: 32]
  const [connectionToastIcon, setConnectionToastIcon] = useState(() => WifiIcon); [cite: 32] // Use a function to set initial state

  // Computed Properties (useMemo equivalents)
  const isDraw = useMemo(() =>
    board.every(cell => cell !== null) && !winner,
    [board, winner]
  );

  const connectedPlayers = useMemo(() => {
    let count = 0;
    if (playerX) count++;
    if (playerO) count++;
    return count;
  }, [playerX, playerO]);

  const isRoomCreator = useMemo(() => creatorPubkey === pubkeyRef.current, [creatorPubkey]);

  const getPlayerBySlot = useCallback((slot) => {
    return slot === 1 ? playerX : playerO; [cite: 33]
  }, [playerX, playerO]);

  const mySymbol = useMemo(() => {
    if (playerX === pubkeyRef.current) return 'X';
    if (playerO === pubkeyRef.current) return 'O';
    return null;
  }, [playerX, playerO]);

  // Methods (functions)
  const generateNewGameId = useCallback(() => {
    setGameId(bytesToHex(generateSecretKey()).slice(0, 8).toUpperCase());
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setConnectionToastMessage(message); [cite: 34]
    setConnectionToastType(type); [cite: 34]
    if (type === 'success') {
      setConnectionToastIcon(() => CheckCircleIcon); [cite: 34]
    } else if (type === 'error') {
      setConnectionToastIcon(() => XCircleIcon); [cite: 35]
    } else {
      setConnectionToastIcon(() => WifiIcon); [cite: 34]
    }
    setShowConnectionToast(true); [cite: 34]
    
    setTimeout(() => {
      setShowConnectionToast(false); [cite: 34]
    }, duration);
  }, []);

  // Forward declaration for mutual recursion (important for connectToRelay and attemptReconnect)
  const connectToRelay = useCallback(async () => {
    try {
      if (subRef.current) subRef.current.close(); [cite: 38]
      
      const filters = [{ kinds: [31337], '#d': [gameId] }]; [cite: 38]
      subRef.current = pool.subscribeMany([relayUrl], filters, {
        onevent: handleGameEvent, [cite: 38]
        oneose: handleSubscriptionEnd, [cite: 38]
        onclose: handleConnectionClose [cite: 38]
      });
      
      setIsConnected(true); [cite: 38]
      reconnectAttemptsRef.current = 0; [cite: 38]
      
    } catch (error) {
      console.error('Failed to connect to relay:', error);
      setIsConnected(false); [cite: 38]
      attemptReconnect(); [cite: 38]
    }
  }, [gameId, relayUrl, pool]); // Dependencies for connectToRelay

  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) { [cite: 47]
      showToast('Failed to reconnect. Please refresh the page.', 'error', 5000); [cite: 47]
      return;
    }
    
    reconnectAttemptsRef.current++; [cite: 47]
    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000); [cite: 47]
    
    setTimeout(() => {
      if (gameStarted && !isConnected) { [cite: 47]
        connectToRelay(); [cite: 47]
      }
    }, delay);
  }, [gameStarted, isConnected, connectToRelay, showToast]);

  const publishGameState = useCallback(async () => {
    if (!pubkeyRef.current || !isConnected) return; [cite: 51]
    
    const event = {
      kind: 31337, [cite: 51]
      created_at: Math.floor(Date.now() / 1000), [cite: 51]
      tags: [['d', gameId]], [cite: 51]
      pubkey: pubkeyRef.current, [cite: 51]
      content: JSON.stringify({
        board: board, [cite: 52]
        currentPlayer: currentPlayer, [cite: 52]
        winner: winner, [cite: 52]
        winningCells: winningCells, [cite: 52]
        version: gameStateVersion, [cite: 52]
        xWins: xWins, [cite: 52]
        oWins: oWins, [cite: 52]
        playerX: playerX, [cite: 52]
        playerO: playerO, [cite: 52]
        gameReady: gameReady, [cite: 52]
        creatorPubkey: creatorPubkey [cite: 52]
      })
    };
    
    try {
      const signedEvent = loginMethod === 'key' 
        ? finalizeEvent(event, secretKeyRef.current) [cite: 53]
        : await window.nostr.signEvent(event); [cite: 53]
      
      await Promise.allSettled(pool.publish([relayUrl], signedEvent)); [cite: 53]
    } catch (error) {
      console.error('Failed to publish game state:', error);
      showToast('Failed to sync game state', 'error');
    }
  }, [gameId, isConnected, board, currentPlayer, winner, winningCells, gameStateVersion, xWins, oWins, playerX, playerO, gameReady, creatorPubkey, loginMethod, relayUrl, pool, showToast]);

  const handleGameEvent = useCallback((event) => {
    try {
      const incomingState = JSON.parse(event.content); [cite: 39]
      
      if (incomingState.version > gameStateVersion) { [cite: 39]
        setBoard(incomingState.board); [cite: 39]
        setCurrentPlayer(incomingState.currentPlayer); [cite: 39]
        setWinner(incomingState.winner); [cite: 39]
        setWinningCells(incomingState.winningCells || []); [cite: 39, 40]
        setGameStateVersion(incomingState.version); [cite: 39]
        setXWins(incomingState.xWins || 0); [cite: 39, 41]
        setOWins(incomingState.oWins || 0); [cite: 39, 42]
        setPlayerX(incomingState.playerX); [cite: 39]
        setPlayerO(incomingState.playerO); [cite: 39]
        setGameReady(incomingState.gameReady || false); [cite: 39, 43]
        setCreatorPubkey(incomingState.creatorPubkey); [cite: 39]
        
        if (incomingState.gameReady) { [cite: 43]
          // Note: mySymbol needs to be calculated based on the updated state,
          // or passed as a dependency if using an older version.
          // For simplicity here, assuming mySymbol would react to updated playerX/O.
          const currentMySymbol = (playerX === pubkeyRef.current ? 'X' : (playerO === pubkeyRef.current ? 'O' : null));
          setIsMyTurn(incomingState.currentPlayer === currentMySymbol); [cite: 43]
          if (event.pubkey !== pubkeyRef.current && !incomingState.winner && !isDraw) { [cite: 43]
            showToast("Opponent moved - your turn!", 'info', 2000); [cite: 43]
          }
        }
        
        onScoreUpdate(Math.max(incomingState.xWins, incomingState.oWins) * 100); [cite: 44]
        
        if (incomingState.winner || isDraw) { [cite: 44]
          const isWinner = (incomingState.winner === mySymbol); // mySymbol needs to be current state
          onGameOver({ [cite: 44]
            score: (isWinner ? 100 : 50), [cite: 45]
            win: isWinner, [cite: 45]
            duration: Date.now(), [cite: 45]
            level: 1 [cite: 45]
          });
        }
      }
    } catch (error) {
      console.error('Failed to parse game event:', error);
    }
  }, [gameStateVersion, isDraw, mySymbol, onScoreUpdate, onGameOver, showToast, playerX, playerO]); // Add relevant state dependencies

  const handleSubscriptionEnd = useCallback(() => {
    // Only set player if slots are truly empty according to the latest state.
    // This is a subtle race condition in distributed systems; consider a more robust handshake.
    if (!playerX) { [cite: 45]
      pubkeyRef.current = pubkeyRef.current || Math.random().toString(36).substring(2, 15); // Fallback if pubkey not set earlier
      setPlayerX(pubkeyRef.current); [cite: 45]
      setCreatorPubkey(pubkeyRef.current); [cite: 45]
      showToast('You joined as Player X!', 'success'); [cite: 45]
    } else if (!playerO && playerX !== pubkeyRef.current) { [cite: 46]
      pubkeyRef.current = pubkeyRef.current || Math.random().toString(36).substring(2, 15);
      setPlayerO(pubkeyRef.current); [cite: 46]
      showToast('You joined as Player O!', 'success'); [cite: 46]
    }
    setGameStateVersion(prev => prev + 1); [cite: 46]
    publishGameState(); [cite: 46]
  }, [playerX, playerO, showToast, publishGameState]);

  const handleConnectionClose = useCallback(() => {
    setIsConnected(false); [cite: 47]
    showToast('Connection lost, attempting to reconnect...', 'error'); [cite: 47]
    attemptReconnect(); [cite: 47]
  }, [showToast, attemptReconnect]);

  const startGame = useCallback(async () => {
    if (!gameId || !relayUrl) { [cite: 36]
      showToast('Please provide relay URL and game ID', 'error'); [cite: 36]
      return;
    }

    try {
      setLoading(true); [cite: 36]
      
      if (loginMethod === 'key') { [cite: 36]
        if (!nsec) { [cite: 36]
          throw new Error('Please enter your private key'); [cite: 36]
        }
        const decoded = decode(nsec.trim()); [cite: 36]
        if (decoded.type !== 'nsec') { [cite: 36]
          throw new Error('Invalid nsec format'); [cite: 36]
        }
        secretKeyRef.current = decoded.data; [cite: 36]
        pubkeyRef.current = getPublicKey(secretKeyRef.current); [cite: 36]
      } else {
        if (!window.nostr) { [cite: 36]
          throw new Error('Nostr extension not found. Please install a Nostr browser extension.'); [cite: 36]
        }
        pubkeyRef.current = await window.nostr.getPublicKey(); [cite: 37]
      }

      await connectToRelay(); [cite: 37]
      setGameStarted(true); [cite: 37]
      showToast('Connected to game room!', 'success'); [cite: 37]
      
    } catch (error) {
      console.error('Failed to start game:', error);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [gameId, relayUrl, loginMethod, nsec, showToast, connectToRelay]);

  // Other game logic functions (makeMove, checkWinner, resetGame, leaveGame, shareRoom)
  // These will also need to be converted to useCallback functions.
  // ...

  // useEffect for onMounted equivalent
  useEffect(() => {
    generateNewGameId(); [cite: 56]
    const urlParams = new URLSearchParams(window.location.search); [cite: 56]
    const roomParam = urlParams.get('room'); [cite: 56]
    const relayParam = urlParams.get('relay'); [cite: 56]
    
    if (roomParam) setGameId(roomParam); [cite: 56]
    if (relayParam) setRelayUrl(decodeURIComponent(relayParam)); [cite: 56]

    // Cleanup function for onBeforeUnmount
    return () => {
      if (subRef.current) subRef.current.close(); [cite: 54]
      pool.close([relayUrl]); // Ensure relayUrl is the final state value before unmount
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  // useEffect for watch(isConnected) equivalent
  useEffect(() => {
    if (isConnected && gameStarted) {
      showToast('Reconnected to game room', 'success', 2000);
    }
  }, [isConnected, gameStarted, showToast]);

  return (
    <div className="nostr-game-container">
      {/* Game Setup Panel */}
      {!gameStarted && ( // v-if="!gameStarted"
        <div className="setup-panel">
          <div className="setup-header">
            <h2 className="game-title">💡 Nostr Tic-Tac-Toe</h2>
            <p className="game-subtitle">Challenge friends in real-time multiplayer</p>
          </div>

          <div className="setup-form">
            <div className="input-group">
              <label>Nostr Relay URL</label>
              <input 
                [cite_start]value={relayUrl} // v-model="relayUrl" [cite: 2]
                onChange={(e) => setRelayUrl(e.target.value)} // v-model="relayUrl"
                type="url" 
                className="input"
                placeholder="wss://relay.damus.io"
              />
            </div>

            <div className="input-group">
              <label>Game Room ID</label>
              <div className="input-with-button">
                <input 
                  [cite_start]value={gameId} // v-model="gameId" [cite: 3]
                  onChange={(e) => setGameId(e.target.value)} // v-model="gameId"
                  type="text" 
                  className="input"
                  placeholder="Enter or generate room ID"
                />
                <button onClick={generateNewGameId} className="btn-icon" title="Generate new ID">
                  <RefreshCwIcon className="w-4 h-4" /> 
                </button>
              </div>
            </div>

            <div className="login-method-selector">
              <div className="method-tabs">
                <button 
                  onClick={() => setLoginMethod('extension')}
                  className={`method-tab ${loginMethod === 'extension' ? 'active' : ''}`} 
                >
                  <BrowserIcon className="w-4 h-4" />
                  Extension
                </button>
                <button 
                  onClick={() => setLoginMethod('key')}
                  className={`method-tab ${loginMethod === 'key' ? 'active' : ''}`} 
                >
                  <KeyIcon className="w-4 h-4" />
                  Private Key
                </button>
              </div>

              {loginMethod === 'key' && ( 
                <div className="key-input-section">
                  <div className="input-group">
                    <label>Nostr Private Key (nsec)</label>
                    <input 
                      value={nsec} 
                      onChange={(e) => setNsec(e.target.value)}
                      type="password" 
                      className="input"
                      placeholder="nsec1..." 
                    />
                  </div>
                  <div className="warning-banner">
                    <AlertTriangleIcon className="w-4 h-4" />
                    <span>Use browser extensions for better security</span>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={startGame} 
              disabled={loading}
              className="btn-primary start-game-btn"
            >
              {loading && <div className="loading-spinner"></div>}
              {loading ? 'Connecting...' : 'Join Game Room'} 
            </button>
          </div>
        </div>
      )}

      {/* Waiting Room */}
      {gameStarted && !gameReady && ( // v-else-if="!gameReady"
        <div className="waiting-room">
          <div className="waiting-header">
            <h2 className="game-title">💡 Waiting for Opponent</h2>
            <p className="game-subtitle">Room: {gameId}</p> 
          </div>

          <div className="players-waiting">
            <div className="player-slots">
              {[...Array(2)].map((_, i) => ( // v-for="i in 2" 
                <div
                  key={i + 1} // :key="i"
                  className={`player-slot ${getPlayerBySlot(i + 1) ? 'filled' : ''} ${getPlayerBySlot(i + 1) === pubkeyRef.current ? [cite_start]'is-me' : ''}`} [cite: 11]
                >
                  {getPlayerBySlot(i + 1) ? (
                    <div className="player-info">
                      <div 
                        className="player-avatar" 
                        [cite_start]style={{ backgroundColor: (i + 1) === 1 ? '#3b82f6' : '#ef4444' }} [cite: 12]
                      >
                        {(i + 1) === 1 ? 'X' : 'O'} 
                      </div>
                      <div className="player-name">
                        {getPlayerBySlot(i + 1) === pubkeyRef.current ? 'You' : `Player ${i + 1}`} 
                      </div>
                    </div>
                  ) : (
                    <div className="empty-slot">
                      <div className="empty-avatar">?</div>
                      <div className="empty-text">Waiting...</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="waiting-info">
              <div className="player-count">
                {connectedPlayers} / 2 players joined 
              </div>
              
              {connectedPlayers === 2 ? ( 
                <div className="ready-section">
                  <div className="ready-message">Both players connected!</div>
                  {isRoomCreator ? ( 
                    <button 
                      onClick={() => { /* startGameRound logic here */ }} // Convert startGameRound
                      className="btn-primary"
                    >
                      Start Game
                    </button>
                  ) : (
                    <div className="waiting-message"> 
                      Waiting for room creator to start the game...
                    </div>
                  )}
                </div>
              ) : (
                <div className="need-more-players"> 
                  Need 1 more player to start
                </div>
              )}
            </div>

            <div className="room-actions">
              <button onClick={() => { /* shareRoom logic here */ }} className="btn-outline">
                <ShareIcon className="w-4 h-4" />
                Share Room
              </button>
              <button onClick={() => { /* leaveGame logic here */ }} className="btn-outline">
                <LogOutIcon className="w-4 h-4" />
                Leave Room 
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Board */}
      {gameReady && ( // v-else
        <div className="game-board-container">
          {/* Game Header */}
          <div className="game-header">
            <div className="game-info">
              <div className="room-info">
                <span className="room-label">Room:</span>
                <span className="room-id">{gameId}</span> 
              </div>
              <div className={`connection-status ${isConnected ? [cite_start]'connected' : ''}`}> 
                <div className="status-dot"></div>
                {isConnected ? 'Connected' : 'Connecting...'} 
              </div>
            </div>

            <div className="game-stats">
              <div className="score-display">
                <div className="score-item x-score">
                  <span className="score-symbol">X</span>
                  <span className="score-value">{xWins}</span> 
                </div>
                <div className="score-divider">-</div> 
                <div className="score-item o-score">
                  <span className="score-symbol">O</span>
                  <span className="score-value">{oWins}</span> 
                </div>
              </div>
            </div>
          </div>

          {/* Turn Indicator */} 
          <div className="turn-indicator">
            {winner ? ( 
              <div className="game-result winner">
                <TrophyIcon className="w-6 h-6" />
                {winner} Wins! 
              </div>
            ) : isDraw ? ( 
              <div className="game-result draw">
                <EqualIcon className="w-6 h-6" />
                It's a Draw! 
              </div>
            ) : (
              <div className="turn-display">
                <div className={`current-player ${currentPlayer.toLowerCase()}`}>
                  {currentPlayer}
                </div>
                <span className="turn-text">
                  {isMyTurn ? "Your turn" : "Opponent's turn"} 
                </span>
              </div>
            )}
          </div>

          {/* Tic-Tac-Toe Board */}
          <div className={`tic-tac-toe-board ${(!isMyTurn || winner || isDraw) ? 'locked' : ''}`}>
            {board.map((cell, index) => (
              <div
                key={index}
                onClick={() => { /* makeMove logic here */ }} // Convert makeMove
                className={`board-cell ${cell === 'X' ? 'has-x' : ''} ${cell === 'O' ? 'has-o' : ''} ${winningCells.includes(index) ? 'winning-cell' : ''}`} 
              >
                {cell && ( // transition is a bit more complex in React, often needs a dedicated library like react-transition-group
                  <span className="cell-content">{cell}</span> 
                )}
              </div>
            ))}
          </div>

          {/* Game Controls */}
          <div className="game-controls">
            <button onClick={() => { /* resetGame logic here */ }} className="btn-outline">
              <RotateCcwIcon className="w-4 h-4" />
              New Round
            </button>
            <button onClick={() => { /* leaveGame logic here */ }} className="btn-outline">
              <LogOutIcon className="w-4 h-4" /> 
              Leave Room
            </button>
            <button onClick={() => { /* shareRoom logic here */ }} className="btn-primary">
              <ShareIcon className="w-4 h-4" />
              Share Room
            </button>
          </div>
        </div>
      )}

      {/* Connection Status Toast */}
      {showConnectionToast && ( 
        <div className={`connection-toast ${connectionToastType}`}> 
          <div className="toast-content">
            {React.createElement(connectionToastIcon, { className: "w-5 h-5" })}
            <span>{connectionToastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NostrTicTacToe;