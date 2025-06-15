
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
      className="relative group cursor-pointer transform transition-transform hover:scale-105"
      onClick={onClick}
      title={`${displayName} - ${getStatusText()}`}
    >
      <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
        <AvatarImage src={player.picture} alt={displayName} />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <OnlineStatusDot status={player.status} />
      
      {/* Friend indicator */}
      {player.is_friend && (
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-gold rounded-full border border-white" />
      )}
    </div>
  );
}
