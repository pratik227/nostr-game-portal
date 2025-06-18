
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Share, LogOut, CheckCircle, Play } from 'lucide-react';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';

interface WaitingRoomProps {
  gameId: string;
  playerX: string | null;
  playerO: string | null;
  currentUserPubkey: string;
  isRoomCreator: boolean;
  connectedPlayers: number;
  onStartGame: () => void;
  onShareRoom: () => void;
  onLeaveRoom: () => void;
}

function PlayerCard({ pubkey, symbol, isCurrentUser }: { pubkey: string | null; symbol: 'X' | 'O'; isCurrentUser: boolean }) {
  const { profile, loading } = usePlayerProfile(pubkey);

  if (!pubkey) {
    return (
      <div className="p-6 border-3 border-dashed border-gray-300 bg-gray-50 rounded-2xl text-center">
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-gray-200 text-gray-400 font-bold text-xl">
            ?
          </div>
          <div className="text-gray-500 font-medium">Waiting...</div>
          <div className="text-sm text-gray-400">Empty slot</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 border-3 border-gray-300 bg-gray-50 rounded-2xl text-center">
        <div className="space-y-3">
          <Skeleton className="w-16 h-16 rounded-full mx-auto" />
          <Skeleton className="h-4 w-20 mx-auto" />
          <Skeleton className="h-3 w-16 mx-auto" />
        </div>
      </div>
    );
  }

  const displayName = profile?.display_name || profile?.name || 'Anonymous';
  const avatarFallback = displayName.charAt(0).toUpperCase();

  return (
    <div
      className={`p-6 border-3 rounded-2xl text-center transition-all duration-300 ${
        isCurrentUser
          ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 ring-4 ring-blue-100'
          : 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
      }`}
    >
      <div className="space-y-3">
        <div className="relative">
          <Avatar className="w-16 h-16 mx-auto">
            <AvatarImage src={profile?.picture} alt={displayName} />
            <AvatarFallback className={`text-white font-bold text-xl ${
              symbol === 'X' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-red-500 to-red-600'
            }`}>
              {profile?.picture ? avatarFallback : symbol}
            </AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
            symbol === 'X' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-red-500 to-red-600'
          }`}>
            {symbol}
          </div>
        </div>
        <div className="font-semibold text-lg text-gray-800">
          {isCurrentUser ? 'You' : displayName}
        </div>
        <div className="text-sm text-gray-600">
          {symbol === 'X' ? 'Room Creator' : 'Challenger'}
        </div>
      </div>
    </div>
  );
}

export function WaitingRoom({
  gameId,
  playerX,
  playerO,
  currentUserPubkey,
  isRoomCreator,
  connectedPlayers,
  onStartGame,
  onShareRoom,
  onLeaveRoom
}: WaitingRoomProps) {
  return (
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
          <PlayerCard 
            pubkey={playerX} 
            symbol="X" 
            isCurrentUser={playerX === currentUserPubkey} 
          />
          <PlayerCard 
            pubkey={playerO} 
            symbol="O" 
            isCurrentUser={playerO === currentUserPubkey} 
          />
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
                  onClick={onStartGame}
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Game
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
          <Button variant="outline" onClick={onShareRoom} className="gap-2 shadow-sm hover:shadow-md">
            <Share className="w-4 h-4" />
            Share Room
          </Button>
          <Button variant="outline" onClick={onLeaveRoom} className="gap-2 shadow-sm hover:shadow-md">
            <LogOut className="w-4 h-4" />
            Leave Room
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
