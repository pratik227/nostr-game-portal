
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OnlineStatusDot } from './OnlineStatusDot';
import { OnlinePlayer } from '@/hooks/useOnlinePlayers';
import { formatDistanceToNow } from 'date-fns';
import { Star } from 'lucide-react';

interface PlayerAvatarProps {
  player: OnlinePlayer;
  onClick?: () => void;
}

export function PlayerAvatar({ player, onClick }: PlayerAvatarProps) {
  const displayName = player.display_name || player.name || 'Anonymous';
  const initials = displayName.charAt(0).toUpperCase();
  
  const getStatusText = () => {
    const timeAgo = formatDistanceToNow(new Date(player.last_seen_at), { addSuffix: true });
    return player.status === 'online' ? 'Online' : `Active ${timeAgo}`;
  };

  return (
    <div 
      className="relative group cursor-pointer transform transition-all duration-200 ease-out hover:scale-105 active:scale-95"
      onClick={onClick}
      title={`${displayName} - ${getStatusText()}`}
    >
      {/* Enhanced touch target for mobile */}
      <div className="p-1">
        <Avatar className="w-12 h-12 border-2 border-white shadow-md transition-shadow duration-200 group-hover:shadow-lg">
          <AvatarImage src={player.picture} alt={displayName} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <OnlineStatusDot 
          status={player.status} 
          className="absolute bottom-1 right-1 w-3 h-3 border-2 border-white shadow-sm"
        />
        
        {/* Friend indicator with better mobile visibility */}
        {player.is_friend && (
          <div className="absolute -top-0.5 -left-0.5 w-4 h-4 bg-gold rounded-full border-2 border-white shadow-sm flex items-center justify-center">
            <Star className="w-2 h-2 text-deep-sea fill-current" />
          </div>
        )}
      </div>
      
      {/* Mobile-friendly name display */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="bg-black/80 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
          {displayName}
        </div>
      </div>
    </div>
  );
}
