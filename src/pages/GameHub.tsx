import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Gamepad2, Trophy, Users, LogOut, User, Wallet, Play, Plus, RefreshCw, MessageCircle, Trash2 } from 'lucide-react';
import FloatingActionMenu from '@/components/FloatingActionMenu';
import { Profile } from '@/components/Profile';
import { useFriendsList } from '@/hooks/useFriendsList';

interface GameHubProps {
  onLogout: () => void;
  onNavigateToProfile: () => void;
}

const games = [
  {
    id: 1,
    name: "Lightning Strike",
    preview: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=200&fit=crop",
    maxPlayers: 4,
    comingSoon: true
  },
  {
    id: 2,
    name: "Nostr Puzzle",
    preview: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=400&h=200&fit=crop",
    maxPlayers: 8,
    comingSoon: true
  },
  {
    id: 3,
    name: "Target Master",  
    preview: "https://images.unsplash.com/photo-1485833077593-4278bba3f11f?w=400&h=200&fit=crop",
    maxPlayers: 2,
    comingSoon: true
  },
  {
    id: 4,
    name: "Arcade Classic",
    preview: "https://images.unsplash.com/photo-1500673922987-e212871fec22?w=400&h=200&fit=crop",
    maxPlayers: 1,
    comingSoon: true
  }
];

export function GameHub({ onLogout, onNavigateToProfile }: GameHubProps) {
  const [activeTab, setActiveTab] = useState<'games' | 'leaderboard' | 'friends'>('games');
  const [newFriendInput, setNewFriendInput] = useState('');
  
  // Get user pubkey from localStorage or context
  const userPubkey = localStorage.getItem('userPubkey') || '';
  const { friends, loading, syncing, addFriend, removeFriend, syncFriendsFromNostr } = useFriendsList(userPubkey);

  const handlePlayGame = (gameId: number) => {
    console.log(`Playing game ${gameId}`);
    // Game logic will be implemented later
  };

  const handleAddFriend = async () => {
    if (!newFriendInput.trim()) return;
    await addFriend(newFriendInput.trim());
    setNewFriendInput('');
  };

  const renderGames = () => (
    <div className="p-4 pb-24">
      <h1 className="text-3xl font-bold text-deep-sea mb-6 tracking-tight">Choose Your Game</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {games.map((game) => {
          const CardComponent = game.comingSoon ? 'div' : 'button';

          return (
            <CardComponent
              key={game.id}
              className={`relative group rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 text-left w-full ${
                game.comingSoon ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
              onClick={() => !game.comingSoon && handlePlayGame(game.id)}
              disabled={game.comingSoon}
            >
              <img
                src={game.preview}
                alt={game.name}
                className="w-full h-48 object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              
              {game.comingSoon && (
                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                  <Badge variant="outline" className="bg-black/50 text-white/90 border-white/30 backdrop-blur-md text-base px-5 py-2 rounded-xl">
                    Coming Soon
                  </Badge>
                </div>
              )}

              <div className="absolute inset-0 p-4 flex flex-col justify-end">
                <h3 className="text-white font-bold text-2xl drop-shadow-lg">{game.name}</h3>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5 text-white/90 text-sm bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <Users className="w-4 h-4" />
                    <span>{game.maxPlayers} Players</span>
                  </div>
                  
                  {!game.comingSoon && (
                    <div className="bg-gold p-3 rounded-full text-deep-sea transform transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:bg-yellow-400 shadow-lg">
                      <Play className="w-6 h-6 fill-current" />
                    </div>
                  )}
                </div>
              </div>
            </CardComponent>
          );
        })}
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="p-4 pb-24 text-center">
      <div className="mt-20">
        <Trophy className="w-16 h-16 text-gold mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-deep-sea mb-2">Leaderboard</h2>
        <p className="text-steel-blue">Coming soon! Compete with players worldwide.</p>
      </div>
    </div>
  );

  const renderFriends = () => (
    <div className="min-h-screen bg-white">
      {/* Clean Header */}
      <div className="px-6 py-8 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">Friends</h1>
            <span className="text-sm text-gray-500 font-medium">
              {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
            </span>
          </div>
          <Button
            onClick={syncFriendsFromNostr}
            disabled={syncing}
            variant="outline"
            size="sm"
            className="border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>

        {/* Clean Add Friend Section */}
        <div className="flex gap-3">
          <Input
            placeholder="Add friend by pubkey or npub..."
            value={newFriendInput}
            onChange={(e) => setNewFriendInput(e.target.value)}
            className="flex-1 border-gray-200 focus:border-teal focus:ring-teal/20 placeholder:text-gray-400"
          />
          <Button 
            onClick={handleAddFriend} 
            disabled={!newFriendInput.trim()}
            className="bg-teal hover:bg-teal/90 text-white px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {/* Friends List */}
      <div className="px-6 pb-24">
        {loading ? (
          <div className="space-y-4 mt-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-32 animate-pulse"></div>
                  <div className="h-3 bg-gray-100 rounded w-48 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">No friends yet</h2>
            <p className="text-gray-500 text-center max-w-sm mb-6">
              Connect with other players by adding their pubkey or npub above, or sync your existing Nostr follows.
            </p>
            <Button 
              onClick={syncFriendsFromNostr} 
              variant="outline"
              className="border-teal text-teal hover:bg-teal hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync from Nostr
            </Button>
          </div>
        ) : (
          <div className="mt-6">
            {friends.map((friend, index) => (
              <div key={friend.id}>
                <div className="flex items-center gap-4 py-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="flex items-center gap-4 flex-1 text-left focus:outline-none focus:ring-2 focus:ring-teal/20 focus:ring-offset-2 rounded-lg p-2 -m-2">
                        <Avatar className="w-12 h-12 ring-1 ring-gray-100">
                          <AvatarImage src={friend.followed_picture || ''} />
                          <AvatarFallback className="bg-gray-50 text-gray-600 font-medium">
                            {friend.followed_display_name?.[0] || friend.followed_name?.[0] || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {friend.followed_display_name || friend.followed_name || 'Anonymous'}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {friend.followed_nip05 || `${friend.followed_npub.slice(0, 20)}...`}
                          </p>
                        </div>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Friend Profile</DialogTitle>
                      </DialogHeader>
                      <Profile 
                        pubkey={friend.followed_pubkey} 
                        onBack={() => {}} 
                      />
                    </DialogContent>
                  </Dialog>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFriend(friend.id)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {index < friends.length - 1 && (
                  <Separator className="bg-gray-100" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'games':
        return renderGames();
      case 'leaderboard':
        return renderLeaderboard();
      case 'friends':
        return renderFriends();
      default:
        return renderGames();
    }
  };

  const menuOptions = [
    {
      label: "Profile",
      Icon: <User className="w-4 h-4" />,
      onClick: onNavigateToProfile,
    },
    {
      label: "Wallet (soon)",
      Icon: <Wallet className="w-4 h-4" />,
      onClick: () => {}, // Wallet is coming soon
    },
    {
      label: "Logout",
      Icon: <LogOut className="w-4 h-4" />,
      onClick: onLogout,
    },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Main Content */}
      <main className="min-h-screen">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center h-16 px-4">
          <Button
            variant={activeTab === 'games' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('games')}
            className={`flex-col h-12 px-6 ${
              activeTab === 'games' 
                ? 'bg-deep-sea text-white' 
                : 'text-steel-blue hover:text-deep-sea'
            }`}
          >
            <Gamepad2 className="w-5 h-5 mb-1" />
            <span className="text-xs">Games</span>
          </Button>
          
          <Button
            variant={activeTab === 'leaderboard' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-col h-12 px-6 ${
              activeTab === 'leaderboard' 
                ? 'bg-deep-sea text-white' 
                : 'text-steel-blue hover:text-deep-sea'
            }`}
          >
            <Trophy className="w-5 h-5 mb-1" />
            <span className="text-xs">Leaderboard</span>
          </Button>
          
          <Button
            variant={activeTab === 'friends' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('friends')}
            className={`flex-col h-12 px-6 ${
              activeTab === 'friends' 
                ? 'bg-deep-sea text-white' 
                : 'text-steel-blue hover:text-deep-sea'
            }`}
          >
            <Users className="w-5 h-5 mb-1" />
            <span className="text-xs">Friends</span>
          </Button>
        </div>
      </div>

      <FloatingActionMenu options={menuOptions} className="bottom-20" />
    </div>
  );
}
