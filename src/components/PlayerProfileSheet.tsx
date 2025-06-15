
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { OnlineStatusDot } from './OnlineStatusDot';
import { OnlinePlayer } from '@/hooks/useOnlinePlayers';
import { formatDistanceToNow } from 'date-fns';
import { UserPlus, User, MessageCircle, Star } from 'lucide-react';
import { toast } from 'sonner';

interface PlayerProfileSheetProps {
  player: OnlinePlayer | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlayerProfileSheet({ player, isOpen, onOpenChange }: PlayerProfileSheetProps) {
  if (!player) return null;

  const displayName = player.display_name || player.name || 'Anonymous';
  const initials = displayName.charAt(0).toUpperCase();
  
  const getStatusText = () => {
    const timeAgo = formatDistanceToNow(new Date(player.last_seen_at), { addSuffix: true });
    return player.status === 'online' ? 'Online now' : `Active ${timeAgo}`;
  };

  const handleAddFriend = () => {
    toast.success(`Friend request sent to ${displayName}`);
    // TODO: Implement friend request functionality
  };

  const handleMessage = () => {
    toast.info('Messaging feature coming soon!');
    // TODO: Implement messaging functionality
  };

  const handleViewProfile = () => {
    toast.info('Full profile view coming soon!');
    // TODO: Navigate to full profile page
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl border-0 bg-white p-0 max-h-[85vh]">
        {/* Handle bar for swipe indication */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        
        <div className="px-6 pb-6">
          <SheetHeader className="text-center space-y-4 mb-6">
            <div className="relative inline-block">
              <Avatar className="w-20 h-20 mx-auto border-4 border-white shadow-lg">
                <AvatarImage src={player.picture} alt={displayName} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <OnlineStatusDot 
                status={player.status} 
                className="absolute bottom-1 right-1 w-4 h-4 border-2 border-white"
              />
              
              {/* Friend indicator */}
              {player.is_friend && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gold rounded-full border-2 border-white flex items-center justify-center">
                  <Star className="w-3 h-3 text-deep-sea fill-current" />
                </div>
              )}
            </div>

            <div>
              <SheetTitle className="text-2xl font-bold text-deep-sea mb-1">
                {displayName}
              </SheetTitle>
              <SheetDescription className="text-steel-blue font-medium">
                {getStatusText()}
              </SheetDescription>
            </div>
          </SheetHeader>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!player.is_friend && (
              <Button 
                onClick={handleAddFriend}
                className="w-full bg-deep-sea hover:bg-deep-sea/90 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Add Friend
              </Button>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleMessage}
                className="py-3 rounded-xl font-semibold flex items-center justify-center gap-2 border-steel-blue text-steel-blue hover:bg-steel-blue hover:text-white"
              >
                <MessageCircle className="w-4 h-4" />
                Message
              </Button>
              
              <Button
                variant="outline"
                onClick={handleViewProfile}
                className="py-3 rounded-xl font-semibold flex items-center justify-center gap-2 border-steel-blue text-steel-blue hover:bg-steel-blue hover:text-white"
              >
                <User className="w-4 h-4" />
                View Profile
              </Button>
            </div>
          </div>

          {/* Player Info */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-steel-blue">Status</span>
                <span className="font-medium text-deep-sea">{getStatusText()}</span>
              </div>
              
              {player.is_friend && (
                <div className="flex justify-between items-center">
                  <span className="text-steel-blue">Relationship</span>
                  <span className="font-medium text-gold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Friend
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
