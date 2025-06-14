
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Gamepad2, Trophy, Users, Settings, LogOut, User, Wallet, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handlePlayGame = (gameId: number) => {
    console.log(`Playing game ${gameId}`);
    // Game logic will be implemented later
  };

  const renderGames = () => (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold text-deep-sea mb-6">Choose Your Game</h1>
      <div className="grid gap-4">
        {games.map((game) => (
          <Card key={game.id} className="overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-0">
              <div className="relative">
                <img 
                  src={game.preview} 
                  alt={game.name}
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <Badge className="absolute top-3 right-3 bg-steel-blue text-white border-0">
                  <Users className="w-3 h-3 mr-1" />
                  {game.maxPlayers}
                </Badge>
              </div>
              
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-deep-sea text-lg">{game.name}</h3>
                  {game.comingSoon && (
                    <Badge variant="outline" className="text-xs mt-1 text-gray-500">
                      Coming Soon
                    </Badge>
                  )}
                </div>
                
                <Button
                  onClick={() => handlePlayGame(game.id)}
                  disabled={game.comingSoon}
                  className="bg-gold hover:bg-gold/90 text-deep-sea font-bold rounded-full w-12 h-12 p-0 shadow-lg"
                >
                  <Play className="w-5 h-5 fill-current" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
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
    <div className="p-4 pb-24 text-center">
      <div className="mt-20">
        <Users className="w-16 h-16 text-teal mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-deep-sea mb-2">Friends</h2>
        <p className="text-steel-blue">Coming soon! Challenge your friends.</p>
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

      {/* Floating Settings Button */}
      <Button
        onClick={() => setSettingsOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-steel-blue hover:bg-deep-sea text-white shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <Settings className="w-6 h-6" />
      </Button>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              variant="ghost"
              onClick={() => {
                setSettingsOpen(false);
                onNavigateToProfile();
              }}
              className="w-full justify-start text-left"
            >
              <User className="w-4 h-4 mr-3" />
              Profile
            </Button>
            
            <Button
              variant="ghost"
              disabled
              className="w-full justify-start text-left text-gray-400"
            >
              <Wallet className="w-4 h-4 mr-3" />
              Wallet (Coming Soon)
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => {
                setSettingsOpen(false);
                onLogout();
              }}
              className="w-full justify-start text-left text-ruby hover:text-ruby hover:bg-ruby/10"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
