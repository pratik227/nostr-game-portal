
import { useOnlinePlayers, OnlinePlayer } from '@/hooks/useOnlinePlayers';
import { PlayerAvatar } from './PlayerAvatar';
import { RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlayersOnlineSectionProps {
  userPubkey: string;
}

export function PlayersOnlineSection({ userPubkey }: PlayersOnlineSectionProps) {
  const { onlinePlayers, loading, refreshOnlinePlayers } = useOnlinePlayers(userPubkey);

  const handlePlayerClick = (player: OnlinePlayer) => {
    console.log('Player clicked:', player);
    // TODO: Show player profile modal
  };

  if (loading) {
    return (
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium text-deep-sea flex items-center gap-2">
          <Users className="w-5 h-5" />
          {onlinePlayers.length > 0 
            ? `${onlinePlayers.length} player${onlinePlayers.length !== 1 ? 's' : ''} online`
            : 'No players online'
          }
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshOnlinePlayers}
          className="w-8 h-8 p-0 text-steel-blue hover:text-deep-sea"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {onlinePlayers.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {onlinePlayers.map((player) => (
            <div key={player.id} className="flex-shrink-0">
              <PlayerAvatar
                player={player}
                onClick={() => handlePlayerClick(player)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-steel-blue">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No players are currently online</p>
          <p className="text-xs mt-1 opacity-75">Invite friends to play together!</p>
        </div>
      )}
    </div>
  );
}
