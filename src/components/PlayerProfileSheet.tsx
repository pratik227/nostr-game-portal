
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OnlineStatusDot } from './OnlineStatusDot';
import { OnlinePlayer } from '@/hooks/useOnlinePlayers';
import { formatDistanceToNow } from 'date-fns';
import { Gamepad2, MessageCircle, Wallet, Copy, ExternalLink, Shield, Calendar, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface PlayerProfileSheetProps {
  player: OnlinePlayer | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlayerProfileSheet({ player, isOpen, onOpenChange }: PlayerProfileSheetProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!player) return null;

  const displayName = player.display_name || player.name || 'Anonymous';
  const initials = displayName.charAt(0).toUpperCase();
  
  const getStatusText = () => {
    const timeAgo = formatDistanceToNow(new Date(player.last_seen_at), { addSuffix: true });
    return player.status === 'online' ? 'Online now' : `Active ${timeAgo}`;
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

  const handleWallet = () => {
    if (player.lud16) {
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
    if (player.website) {
      window.open(player.website.startsWith('http') ? player.website : `https://${player.website}`, '_blank');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-0 bg-white p-0 max-h-[90vh] overflow-hidden">
        {/* Handle bar */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>
        
        <div className="px-6 pb-8 overflow-y-auto max-h-[calc(90vh-2rem)]">
          {/* Hero Section */}
          <div className="text-center mb-8">
            {/* Avatar with status */}
            <div className="relative inline-block mb-4">
              <Avatar className="w-24 h-24 mx-auto border-4 border-white shadow-xl ring-4 ring-gray-100">
                <AvatarImage src={player.picture} alt={displayName} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 text-white text-3xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <OnlineStatusDot 
                status={player.status} 
                className="absolute bottom-2 right-2 w-5 h-5 border-3 border-white shadow-lg"
              />
            </div>

            {/* Name and Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <SheetTitle className="text-2xl font-bold text-gray-900">
                  {displayName}
                </SheetTitle>
                {player.nip05 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {player.lud16 && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
                    <Zap className="w-3 h-3 mr-1" />
                    Lightning
                  </Badge>
                )}
              </div>
              <SheetDescription className="text-steel-blue font-medium text-base">
                {getStatusText()}
              </SheetDescription>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 mb-8">
            <Button 
              onClick={handleBattleInvite}
              className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Gamepad2 className="w-6 h-6 mr-3" />
              Battle Invite
            </Button>
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={handleMessage}
                className="py-4 rounded-2xl font-bold text-base border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Message
              </Button>
              
              <Button
                variant="outline"
                onClick={handleWallet}
                className={`py-4 rounded-2xl font-bold text-base border-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                  player.lud16 
                    ? 'border-yellow-200 text-yellow-600 hover:bg-yellow-50 hover:border-yellow-300' 
                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!player.lud16}
              >
                <Wallet className="w-5 h-5 mr-2" />
                Wallet
              </Button>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            {/* About Section */}
            {player.about && (
              <div className="bg-gray-50 rounded-2xl p-5">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">About</h3>
                <p className="text-gray-700 leading-relaxed">{player.about}</p>
              </div>
            )}

            {/* Details Grid */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-lg">Details</h3>
              
              {/* Nostr ID */}
              {player.npub && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Copy className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Nostr ID</p>
                      <p className="text-sm text-gray-500 font-mono truncate max-w-[200px]">
                        {player.npub}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(player.npub!, 'Nostr ID')}
                    className={`transition-colors ${copiedField === 'Nostr ID' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Lightning Address */}
              {player.lud16 && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Lightning Address</p>
                      <p className="text-sm text-gray-600 font-mono">{player.lud16}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(player.lud16!, 'Lightning Address')}
                    className={`transition-colors ${copiedField === 'Lightning Address' ? 'text-green-600' : 'text-yellow-600 hover:text-yellow-700'}`}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* NIP-05 Verification */}
              {player.nip05 && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Verified Identity</p>
                      <p className="text-sm text-gray-600">{player.nip05}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Website */}
              {player.website && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Website</p>
                      <p className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer" onClick={handleWebsiteClick}>
                        {player.website}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleWebsiteClick}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Member Since */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Last Active</p>
                  <p className="text-sm text-gray-600">{getStatusText()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
