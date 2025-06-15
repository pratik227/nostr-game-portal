
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OnlineStatusDot } from './OnlineStatusDot';
import { OnlinePlayer } from '@/hooks/useOnlinePlayers';
import { formatDistanceToNow } from 'date-fns';

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
    >
      <div 
        className="p-1"
        title={`${displayName} - ${getStatusText()}`}
      >
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
      </div>
      
      {/* Name display on hover, positioned above the avatar */}
      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none w-max max-w-xs z-10">
        <div className="bg-black/80 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
          {displayName}
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 bottom-[-4px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/80"></div>
      </div>
    </div>
  );
}
