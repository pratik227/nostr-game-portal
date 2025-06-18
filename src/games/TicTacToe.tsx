
import { useState, useEffect, useCallback, useRef } from 'react';
import { SimplePool } from 'nostr-tools/pool';
import { finalizeEvent } from 'nostr-tools/pure';
import { bytesToHex } from '@noble/hashes/utils';
import { generateSecretKey } from 'nostr-tools/pure';
import {
  RefreshCw,
  AlertTriangle,
  Trophy,
  Equal,
  RotateCcw,
  LogOut,
  Share,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GameState {
  board: (string | null)[];
  currentPlayer: string;
  winner: string | null;
  winningCells: number[];
  version: number;
  xWins: number;
  oWins: number;
  playerX: string | null;
  playerO: string | null;
  gameReady: boolean;
  creatorPubkey: string | null;
}

interface TicTacToeProps {
  pubkey: string;
  onBack: () => void;
}

export function TicTacToe({ pubkey, onBack }: TicTacToeProps) {
  // Game State
  const [relayUrl] = useState('wss://relay.damus.io');
  const [gameId, setGameId] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Nostr Connection
  const pool = useRef(new SimplePool());
  const sub = useRef<any>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Game Logic
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState<string | null>(null);
  const [winningCells, setWinningCells] = useState<number[]>([]);
  const gameStateVersion = useRef(0);
  const [xWins, setXWins] = useState(0);
  const [oWins, setOWins] = useState(0);
  const [playerX, setPlayerX] = useState<string | null>(null);
  const [playerO, setPlayerO] = useState<string | null>(null);
  const [gameReady, setGameReady] = useState(false);
  const [creatorPubkey, setCreatorPubkey] = useState<string | null>(null);

  // UI State
  const [showConnectionToast, setShowConnectionToast] = useState(false);
  const [connectionToastMessage, setConnectionToastMessage] = useState('');
  const [connectionToastType, setConnectionToastType] = useState<'info' | 'success' | 'error'>('info');
  const ConnectionToastIcon =
    connectionToastType === 'success' ? CheckCircle :
    connectionToastType === 'error' ? XCircle : Wifi;

  // Computed Properties
  const isDraw = board.every(cell => cell !== null) && !winner;
  const connectedPlayers = (playerX ? 1 : 0) + (playerO ? 1 : 0);
  const isRoomCreator = creatorPubkey === pubkey;
  const mySymbol = playerX === pubkey ? 'X' : playerO === pubkey ? 'O' : null;
  const isMyTurn = mySymbol === currentPlayer;

  const getPlayerBySlot = (slot: number) => {
    return slot === 1 ? playerX : playerO;
  };

  const generateNewGameId = () => {
    setGameId(bytesToHex(generateSecretKey()).slice(0, 8).toUpperCase());
  };

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info', duration = 3000) => {
    setConnectionToastMessage(message);
    setConnectionToastType(type);
    setShowConnectionToast(true);

    setTimeout(() => {
      setShowConnectionToast(false);
    }, duration);
  };

  const publishGameState = useCallback(async (stateToPublish?: Partial<GameState>) => {
    if (!pubkey || !isConnected) return;

    const currentState = {
        board,
        currentPlayer,
        winner,
        winningCells,
        version: gameStateVersion.current + 1,
        xWins,
        oWins,
        playerX,
        playerO,
        gameReady,
        creatorPubkey,
        ...stateToPublish
    };
    gameStateVersion.current = currentState.version;

    const event = {
      kind: 31337,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['d', gameId]],
      pubkey,
      content: JSON.stringify(currentState)
    };

    try {
      const signedEvent = await window.nostr.signEvent(event);
      await Promise.allSettled(pool.current.publish([relayUrl], signedEvent));
      console.log('Published game state:', currentState);
    } catch (error) {
      console.error('Failed to publish game state:', error);
      showToast('Failed to sync game state', 'error');
    }
  }, [pubkey, isConnected, gameId, board, currentPlayer, winner, winningCells, xWins, oWins, playerX, playerO, gameReady, creatorPubkey, relayUrl]);

  const handleGameEvent = useCallback((event: any) => {
    try {
      const incomingState: GameState = JSON.parse(event.content);
      console.log('Received game event:', incomingState, 'from pubkey:', event.pubkey);

      if (incomingState.version > gameStateVersion.current) {
        console.log('Updating game state from version', gameStateVersion.current, 'to', incomingState.version);
        gameStateVersion.current = incomingState.version;
        setBoard(incomingState.board);
        setCurrentPlayer(incomingState.currentPlayer);
        setWinner(incomingState.winner);
        setWinningCells(incomingState.winningCells || []);
        setXWins(incomingState.xWins || 0);
        setOWins(incomingState.oWins || 0);
        setPlayerX(incomingState.playerX);
        setPlayerO(incomingState.playerO);
        setGameReady(incomingState.gameReady || false);
        setCreatorPubkey(incomingState.creatorPubkey);

        if (incomingState.gameReady && event.pubkey !== pubkey && !incomingState.winner) {
           const myCurrSymbol = incomingState.playerX === pubkey ? 'X' : incomingState.playerO === pubkey ? 'O' : null;
           if(incomingState.currentPlayer === myCurrSymbol) {
             showToast("Opponent moved - your turn!", 'info', 2000);
           }
        }
      }
    } catch (error) {
      console.error('Failed to parse game event:', error);
    }
  }, [pubkey]);

  const handleSubscriptionEnd = useCallback(async () => {
    console.log('Subscription ended, checking if we can join. Current state:', { playerX, playerO, pubkey, gameStarted });
    
    if (pubkey && gameStarted) {
      // Wait a bit to ensure we have the latest state
      setTimeout(async () => {
        console.log('After timeout, current state:', { playerX, playerO, pubkey });
        let shouldJoin = false;
        let newPlayerX = playerX;
        let newPlayerO = playerO;
        let newCreatorPubkey = creatorPubkey;

        // Check if we can join as player X
        if (!newPlayerX) {
          newPlayerX = pubkey;
          newCreatorPubkey = pubkey;
          setPlayerX(pubkey);
          setCreatorPubkey(pubkey);
          showToast('You joined as Player X (Room Creator)!', 'success');
          shouldJoin = true;
          console.log('Joining as Player X');
        } 
        // Check if we can join as player O (and we're not already X)
        else if (!newPlayerO && newPlayerX !== pubkey) {
          newPlayerO = pubkey;
          setPlayerO(pubkey);
          showToast('You joined as Player O!', 'success');
          shouldJoin = true;
          console.log('Joining as Player O');
        }

        // Only publish if we actually joined
        if (shouldJoin) {
          console.log('Publishing join state:', { playerX: newPlayerX, playerO: newPlayerO, creatorPubkey: newCreatorPubkey });
          await publishGameState({
            playerX: newPlayerX,
            playerO: newPlayerO,
            creatorPubkey: newCreatorPubkey
          });
        } else {
          console.log('Not joining - room might be full or we are already in');
        }
      }, 500);
    }
  }, [playerX, playerO, pubkey, publishGameState, creatorPubkey, gameStarted]);

  const connectToRelay = useCallback(async () => {
    try {
      if (sub.current) sub.current.close();

      const filters = [{ kinds: [31337], '#d': [gameId] }];
      console.log('Connecting to relay with filters:', filters);
      
      sub.current = pool.current.subscribeMany([relayUrl], filters, {
        onevent: handleGameEvent,
        oneose: handleSubscriptionEnd,
        onclose: () => handleConnectionClose(),
      });

      setIsConnected(true);
      reconnectAttempts.current = 0;
      console.log('Connected to relay successfully');

    } catch (error) {
      console.error('Failed to connect to relay:', error);
      setIsConnected(false);
      attemptReconnect();
    }
  }, [gameId, relayUrl, handleGameEvent, handleSubscriptionEnd]);

  const startGame = async () => {
    if (!gameId || !relayUrl) {
      showToast('Please provide a game ID', 'error');
      return;
    }

    if (!window.nostr) {
      showToast('Nostr extension not found. Please install a Nostr browser extension.', 'error');
      return;
    }

    try {
      setLoading(true);
      console.log('Starting game with pubkey:', pubkey, 'gameId:', gameId);
      await connectToRelay();
      setGameStarted(true);
      showToast('Connected to game room!', 'success');
    } catch (error) {
      console.error('Failed to start game:', error);
      showToast(error instanceof Error ? error.message : 'Failed to start game', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionClose = () => {
    setIsConnected(false);
    showToast('Connection lost, attempting to reconnect...', 'error');
    attemptReconnect();
  };

  const attemptReconnect = () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      showToast('Failed to reconnect. Please refresh the page.', 'error', 5000);
      return;
    }

    reconnectAttempts.current++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);

    setTimeout(() => {
      if (gameStarted && !isConnected) {
        connectToRelay();
      }
    }, delay);
  };

  const startGameRound = () => {
    if (!isRoomCreator || connectedPlayers < 2) return;

    const newState = {
        gameReady: true,
        board: Array(9).fill(null),
        currentPlayer: 'X',
        winner: null,
        winningCells: [],
    };
    setGameReady(newState.gameReady);
    setBoard(newState.board);
    setCurrentPlayer(newState.currentPlayer);
    setWinner(newState.winner);
    setWinningCells(newState.winningCells);
    publishGameState(newState);
    showToast('Game started!', 'success');
  };

  const makeMove = async (index: number) => {
    if (!isMyTurn || board[index] || winner || isDraw || !gameReady) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    let newWinner: string | null = null;
    let newWinningCells: number[] = [];

    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        newWinner = newBoard[a];
        newWinningCells = pattern;
        break;
      }
    }

    if (newWinner) {
        setWinner(newWinner);
        setWinningCells(newWinningCells);
        if (newWinner === 'X') {
            setXWins(prev => prev + 1);
        } else {
            setOWins(prev => prev + 1);
        }
    }

    const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';
    setCurrentPlayer(nextPlayer);

    await publishGameState({
        board: newBoard,
        currentPlayer: nextPlayer,
        winner: newWinner,
        winningCells: newWinningCells,
        xWins: newWinner === 'X' ? xWins + 1 : xWins,
        oWins: newWinner === 'O' ? oWins + 1 : oWins,
    });
  };

  const resetGame = async () => {
    const newState = {
        board: Array(9).fill(null),
        currentPlayer: 'X',
        winner: null,
        winningCells: [],
    };
    setBoard(newState.board);
    setCurrentPlayer(newState.currentPlayer);
    setWinner(newState.winner);
    setWinningCells(newState.winningCells);
    await publishGameState(newState);
    showToast('New round started!', 'info');
  };

  const leaveGame = () => {
    if (sub.current) sub.current.close();
    setGameStarted(false);
    setIsConnected(false);

    // Reset game state
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setWinningCells([]);
    gameStateVersion.current = 0;
    setXWins(0);
    setOWins(0);
    setPlayerX(null);
    setPlayerO(null);
    setGameReady(false);
    setCreatorPubkey(null);
    
    // Go back to games list
    onBack();
  };

  const shareRoom = async () => {
    const shareUrl = `${window.location.origin}?game=tictactoe&room=${gameId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Tic-Tac-Toe game!',
          text: 'Play Tic-Tac-Toe with me on Nostr',
          url: shareUrl
        });
      } catch (error) {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Room link copied to clipboard!', 'success');
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Room link copied to clipboard!', 'success');
    }
  };

  useEffect(() => {
    // Check URL parameters for game room
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    
    if (roomParam) {
      setGameId(roomParam);
    } else {
      generateNewGameId();
    }

    return () => {
      if (sub.current) sub.current.close();
      pool.current.close([relayUrl]);
    };
  }, []);

  useEffect(() => {
    if (isConnected && gameStarted) {
      showToast('Reconnected to game room', 'success', 2000);
    }
  }, [isConnected, gameStarted]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="gap-2 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            ← Back to Games
          </Button>
        </div>

        {/* Game Setup Panel */}
        {!gameStarted ? (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🎯 Tic-Tac-Toe
              </CardTitle>
              <p className="text-lg text-gray-600 mt-2">Challenge friends in real-time multiplayer</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">Game Room ID</label>
                <div className="flex space-x-3">
                  <input
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value)}
                    type="text"
                    className="flex-1 p-3 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                    placeholder="Enter or generate room ID"
                  />
                  <Button
                    variant="outline"
                    onClick={generateNewGameId}
                    size="icon"
                    className="p-3 h-12 w-12 border-2 hover:border-blue-500 hover:bg-blue-50"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-800 font-medium">Using your connected Nostr identity</span>
              </div>

              <Button
                onClick={startGame}
                disabled={loading}
                className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    Connecting...
                  </>
                ) : (
                  'Join Game Room'
                )}
              </Button>
            </CardContent>
          </Card>
        ) : !gameReady ? (
        /* Waiting Room */
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl font-bold text-gray-800">🎯 Waiting for Opponent</CardTitle>
              <div className="flex items-center justify-center space-x-2 mt-3">
                <span className="text-gray-600">Room:</span>
                <Badge variant="outline" className="font-mono text-lg px-3 py-1 bg-blue-50 border-blue-200 text-blue-700">
                  {gameId}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className={`p-6 border-3 rounded-2xl text-center transition-all duration-300 ${
                      getPlayerBySlot(i)
                        ? 'border-solid border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
                        : 'border-dashed border-gray-300 bg-gray-50'
                    } ${getPlayerBySlot(i) === pubkey ? '!border-blue-400 !bg-gradient-to-br !from-blue-50 !to-indigo-50 ring-4 ring-blue-100' : ''}`}
                  >
                    {getPlayerBySlot(i) ? (
                      <div className="space-y-3">
                        <div
                          className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white font-bold text-2xl shadow-lg ${
                            i === 1 ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-red-500 to-red-600'
                          }`}
                        >
                          {i === 1 ? 'X' : 'O'}
                        </div>
                        <div className="font-semibold text-lg text-gray-800">
                          {getPlayerBySlot(i) === pubkey ? 'You' : `Player ${i}`}
                        </div>
                        <div className="text-sm text-gray-600">
                          {i === 1 ? 'Room Creator' : 'Challenger'}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-gray-200 text-gray-400 font-bold text-xl">
                          ?
                        </div>
                        <div className="text-gray-500 font-medium">Waiting...</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-center space-y-6">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-xl font-semibold text-gray-800">{connectedPlayers} / 2 players joined</span>
                </div>

                {connectedPlayers === 2 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-green-600 font-semibold text-lg">
                      <CheckCircle className="w-6 h-6" />
                      <span>Both players connected!</span>
                    </div>
                    {isRoomCreator ? (
                      <Button 
                        onClick={startGameRound}
                        size="lg"
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                      >
                        🚀 Start Game
                      </Button>
                    ) : (
                      <div className="text-amber-600 font-medium">
                        Waiting for room creator to start the game...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-amber-600 font-medium text-lg">Need 1 more player to start</div>
                )}
              </div>

              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={shareRoom} className="gap-2 shadow-sm hover:shadow-md">
                  <Share className="w-4 h-4" />
                  Share Room
                </Button>
                <Button variant="outline" onClick={leaveGame} className="gap-2 shadow-sm hover:shadow-md">
                  <LogOut className="w-4 h-4" />
                  Leave Room
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
        /* Game Board */
          <div className="space-y-6">
            {/* Game Header */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className='flex items-center gap-6'>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600 text-sm font-medium">Room:</span>
                        <Badge variant="outline" className="font-mono bg-blue-50 border-blue-200 text-blue-700">{gameId}</Badge>
                      </div>
                       <div className="flex items-center space-x-4 bg-gray-50 px-4 py-2 rounded-xl">
                          <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">X</div>
                              <span className="font-bold text-lg">{xWins}</span>
                          </div>
                          <div className="text-gray-400 font-bold">-</div>
                          <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold">O</div>
                              <span className="font-bold text-lg">{oWins}</span>
                          </div>
                      </div>
                  </div>
                  <div className={`flex items-center space-x-2 text-sm px-3 py-1 rounded-full ${isConnected ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-50'}`}>
                    <div className="w-2 h-2 rounded-full bg-current" />
                    <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Turn Indicator */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                {winner ? (
                  <div className="flex items-center justify-center space-x-3 text-xl font-bold text-green-600">
                    <Trophy className="w-8 h-8" />
                    <span className="text-2xl">{winner} Wins! 🎉</span>
                  </div>
                ) : isDraw ? (
                  <div className="flex items-center justify-center space-x-3 text-xl font-bold text-amber-600">
                    <Equal className="w-8 h-8" />
                    <span className="text-2xl">It's a Draw! 🤝</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl shadow-lg ${
                        currentPlayer === 'X' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-red-500 to-red-600'
                      }`}
                    >
                      {currentPlayer}
                    </div>
                    <span className="text-xl font-semibold text-gray-800">
                      {isMyTurn ? "🎯 Your turn!" : "⏳ Opponent's turn"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tic-Tac-Toe Board */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
              <div
                className={`grid grid-cols-3 gap-3 max-w-md mx-auto ${
                  !isMyTurn || winner || isDraw ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                {board.map((cell, index) => (
                  <button
                    key={index}
                    onClick={() => makeMove(index)}
                    className={`aspect-square bg-white border-3 rounded-xl flex items-center justify-center text-4xl font-bold cursor-pointer transition-all hover:border-blue-400 hover:shadow-lg transform hover:-translate-y-1 ${
                      cell === 'X'
                        ? 'text-blue-600 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md'
                        : cell === 'O'
                        ? 'text-red-600 border-red-300 bg-gradient-to-br from-red-50 to-red-100 shadow-md'
                        : 'border-gray-200 hover:bg-gray-50'
                    } ${winningCells.includes(index) ? '!bg-gradient-to-br !from-green-100 !to-emerald-100 !border-green-400 ring-4 ring-green-200' : ''}`}
                  >
                    {cell && (
                      <span className="block animate-bounce">
                        {cell}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Game Controls */}
            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={resetGame} className="gap-2 shadow-sm hover:shadow-md">
                <RotateCcw className="w-4 h-4" />
                New Round
              </Button>
              <Button variant="outline" onClick={leaveGame} className="gap-2 shadow-sm hover:shadow-md">
                <LogOut className="w-4 h-4" />
                Leave Room
              </Button>
              <Button onClick={shareRoom} className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl">
                <Share className="w-4 h-4" />
                Share Room
              </Button>
            </div>
          </div>
        )}

        {/* Connection Status Toast */}
        {showConnectionToast && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl text-white transition-all duration-300 backdrop-blur-sm ${
              connectionToastType === 'info' ? 'bg-blue-500/90' :
              connectionToastType === 'success' ? 'bg-green-500/90' : 'bg-red-500/90'
            }`}
          >
            <div className="flex items-center space-x-3">
              <ConnectionToastIcon className="w-6 h-6" />
              <span className="font-medium">{connectionToastMessage}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
