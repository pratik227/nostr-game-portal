
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Star, 
  Copy, 
  Trash2, 
  Users,
  Plus
} from 'lucide-react';
import { FriendProfileModal } from './FriendProfileModal';
import { type Friend, type FriendCircle } from '@/hooks/useFriendsList';
import {  toast } from 'sonner';

interface SwipeableCardProps {
  friend: Friend;
  circles: FriendCircle[];
  onToggleFavorite: (friendId: string) => Promise<void>;
  onRemoveFriend: (friendId: string) => Promise<void>;
  onAddToCircle: (friendPubkey: string, circleId: string) => Promise<void>;
  showActions?: boolean;
}

export function SwipeableCard({
  friend,
  circles,
  onToggleFavorite,
  onRemoveFriend,
  onAddToCircle,
  showActions = false
}: SwipeableCardProps) {
  const [showProfile, setShowProfile] = useState(false);
  const [showCircleSelector, setShowCircleSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const copyNpub = (npub: string) => {
    navigator.clipboard.writeText(npub);
    toast.success('Npub copied to clipboard');
  };

  // Get circles this friend is not already in
  const availableCircles = circles.filter(circle => 
    !circle.members?.some(member => member.followed_pubkey === friend.followed_pubkey)
  );

  const handleToggleFavorite = async () => {
    setIsLoading(true);
    try {
      await onToggleFavorite(friend.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (window.confirm('Remove this friend?')) {
      setIsLoading(true);
      try {
        await onRemoveFriend(friend.id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAddToCircle = async (circleId: string) => {
    setIsLoading(true);
    try {
      await onAddToCircle(friend.followed_pubkey, circleId);
      setShowCircleSelector(false);
      toast.success('Friend added to circle');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 py-3 relative">
        {/* Main Friend Info - Clickable */}
        <button
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-3 flex-1 text-left"
          disabled={isLoading}
        >
          <Avatar className="w-10 h-10 ring-1 ring-gray-200">
            <AvatarImage src={friend.followed_picture || ''} />
            <AvatarFallback className="bg-gray-50 text-gray-600">
              {friend.followed_display_name?.[0] || friend.followed_name?.[0] || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {friend.followed_display_name || friend.followed_name || 'Anonymous'}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {friend.followed_nip05 || `${friend.followed_npub?.slice(0, 20)}...`}
            </p>
          </div>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Add to Circle Button */}
          {availableCircles.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCircleSelector(true)}
              disabled={isLoading}
              className="text-teal hover:text-teal hover:bg-teal/10 p-2"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}

          {/* Favorite Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleToggleFavorite}
            disabled={isLoading}
            className={friend.is_favorite ? 
              "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 p-2" : 
              "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 p-2"
            }
          >
            <Star className={`w-4 h-4 ${friend.is_favorite ? 'fill-current' : ''}`} />
          </Button>

          {/* Copy Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyNpub(friend.followed_npub || '')}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <Copy className="w-4 h-4" />
          </Button>

          {/* Remove Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRemoveFriend}
            disabled={isLoading}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Enhanced Friend Profile Modal */}
      <FriendProfileModal
        friend={friend}
        isOpen={showProfile}
        onOpenChange={setShowProfile}
      />

      {/* Circle Selector Dialog */}
      {showCircleSelector && (
        <Dialog open={showCircleSelector} onOpenChange={setShowCircleSelector}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add to Circle</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Choose a circle to add {friend.followed_display_name || friend.followed_name || 'this friend'} to:
              </p>
              
              {availableCircles.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    This friend is already in all your circles
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableCircles.map((circle) => (
                    <Button
                      key={circle.id}
                      variant="outline"
                      onClick={() => handleAddToCircle(circle.id)}
                      disabled={isLoading}
                      className="w-full justify-start h-auto py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4" />
                        <div className="text-left">
                          <div className="font-medium">{circle.name}</div>
                          <div className="text-xs text-gray-500">
                            {circle.members?.length || 0} members
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
