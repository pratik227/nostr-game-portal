
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OnlineStatusDot } from './OnlineStatusDot';
import { type Friend } from '@/hooks/useFriendsList';
import { formatDistanceToNow } from 'date-fns';
import { 
  Gamepad2, 
  MessageCircle, 
  Zap, 
  Copy, 
  ExternalLink, 
  Shield, 
  Calendar,
  Users,
  Star,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';

interface FriendProfileModalProps {
  friend: Friend | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type OnlineStatus = 'online' | 'recent' | 'offline';

const getStatus = (lastSeenAt: string | null | undefined): OnlineStatus => {
  if (!lastSeenAt) return 'offline';
  const lastSeenDate = new Date(lastSeenAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);

  if (diffMinutes < 15) return 'online';
  if (diffMinutes < 24 * 60) return 'recent';
  return 'offline';
};

export function FriendProfileModal({ friend, isOpen, onOpenChange }: FriendProfileModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!friend) return null;

  const displayName = friend.followed_display_name || friend.followed_name || 'Anonymous Gamer';
  const initials = displayName.charAt(0).toUpperCase();
  const status = getStatus(friend.last_seen_at);
  
  const getStatusText = () => {
    if (!friend.last_seen_at) return 'Status unknown';
    const timeAgo = formatDistanceToNow(new Date(friend.last_seen_at), { addSuffix: true });
    return status === 'online' ? 'Online now' : `Active ${timeAgo}`;
  };

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleBattleInvite = () => {
    toast.info('🎮 Battle invite feature coming soon!', {
      description: `Get ready to challenge ${displayName} to epic battles!`
    });
  };

  const handleMessage = () => {
    toast.info('💬 Direct messaging coming soon!', {
      description: `Start conversations with ${displayName}`
    });
  };

  const handleLightningPayment = () => {
    if (friend.followed_lud16) {
      toast.info('⚡ Lightning payments coming soon!', {
        description: 'One-click sat payments will be available here'
      });
    } else {
      toast.info('No Lightning address available', {
        description: `${displayName} hasn't set up Lightning payments yet`
      });
    }
  };

  const handleWebsiteClick = () => {
    if (friend.followed_website) {
      const url = friend.followed_website.startsWith('http') 
        ? friend.followed_website 
        : `https://${friend.followed_website}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-3xl border-0 bg-gray-50 p-0 max-h-[92vh] overflow-hidden flex flex-col"
      >
        {/* Handle bar for iOS-style interaction */}
        <div className="flex-shrink-0 flex justify-center pt-4 pb-2 bg-gray-50 z-10">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>
        
        <div className="overflow-y-auto scrollbar-hide">
          {/* Banner and Profile Header */}
          <div className="relative">
            {/* Banner Image */}
            <div className="h-36 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500">
              {friend.followed_banner ? (
                <img 
                  src={friend.followed_banner} 
                  alt={`${displayName}'s banner`} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 flex items-center justify-center">
                  <div className="text-white/30 text-6xl font-bold">
                    <Gamepad2 className="w-16 h-16" />
                  </div>
                </div>
              )}
              {/* Overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            {/* Avatar positioned over banner */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-white shadow-xl ring-2 ring-gray-100">
                  <AvatarImage src={friend.followed_picture || ''} alt={displayName} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 text-white text-3xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {status !== 'offline' && (
                  <OnlineStatusDot 
                    status={status} 
                    className="absolute bottom-2 right-2 w-6 h-6 border-4 border-white shadow-lg"
                  />
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-16 px-6 pb-8 bg-gray-50">
            {/* Name and Status */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
                <SheetTitle className="text-2xl font-bold text-gray-900">
                  {displayName}
                </SheetTitle>
                {friend.is_favorite && (
                  <Star className="w-6 h-6 text-yellow-500 fill-current" />
                )}
              </div>
              
              <div className="flex items-center justify-center gap-2 flex-wrap mb-2">
                {friend.followed_nip05 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 border border-green-200/50 text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {friend.followed_lud16 && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-200/50 text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Lightning
                  </Badge>
                )}
              </div>
              
              <SheetDescription className="text-gray-600 font-medium text-base">
                {getStatusText()}
              </SheetDescription>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-3 mb-8">
              <Button 
                onClick={handleBattleInvite}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-4 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Gamepad2 className="w-5 h-5 mr-3" />
                Challenge to Battle
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleMessage}
                  className="py-4 rounded-xl font-semibold text-base bg-white border-2 border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Message
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleLightningPayment}
                  className={`py-4 rounded-xl font-semibold text-base bg-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md ${
                    friend.followed_lud16 
                      ? 'border-2 border-yellow-200 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-300' 
                      : 'border-2 border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                  }`}
                  disabled={!friend.followed_lud16}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Send Sats
                </Button>
              </div>
            </div>

            {/* Profile Information */}
            <div className="space-y-5">
              {friend.followed_about && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200/50 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-3 text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    About
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-sm">{friend.followed_about}</p>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-bold text-gray-800 text-base px-1 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-gray-600" />
                  Details
                </h3>
                
                {/* Nostr ID */}
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200/50 shadow-sm">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Copy className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm">Nostr ID</p>
                      <p className="text-xs text-gray-500 font-mono truncate">
                        {friend.followed_npub || 'Not available'}
                      </p>
                    </div>
                  </div>
                  {friend.followed_npub && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(friend.followed_npub!, 'Nostr ID')}
                      className={`flex-shrink-0 transition-colors ${
                        copiedField === 'Nostr ID' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Lightning Address */}
                {friend.followed_lud16 && (
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200/50 shadow-sm">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Zap className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm">Lightning Address</p>
                        <p className="text-xs text-gray-600 font-mono truncate">{friend.followed_lud16}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(friend.followed_lud16!, 'Lightning Address')}
                      className={`flex-shrink-0 transition-colors ${
                        copiedField === 'Lightning Address' ? 'text-green-600' : 'text-yellow-600 hover:text-yellow-700'
                      }`}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Verified Identity */}
                {friend.followed_nip05 && (
                  <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200/50 shadow-sm">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm">Verified Identity</p>
                      <p className="text-xs text-gray-600 truncate">{friend.followed_nip05}</p>
                    </div>
                  </div>
                )}

                {/* Website */}
                {friend.followed_website && (
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200/50 shadow-sm">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <ExternalLink className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm">Website</p>
                        <p className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer truncate" onClick={handleWebsiteClick}>
                          {friend.followed_website}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleWebsiteClick}
                      className="flex-shrink-0 text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Friend Since */}
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200/50 shadow-sm">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm">Friend Since</p>
                    <p className="text-xs text-gray-600">
                      {/* Only display if property exists */}
                      {'created_at' in friend && friend.created_at
                        ? formatDistanceToNow(new Date(friend.created_at), { addSuffix: true })
                        : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
