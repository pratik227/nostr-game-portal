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
      <SheetContent side="bottom" className="rounded-t-3xl border-0 bg-gray-50 p-0 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Handle bar */}
        <div className="flex-shrink-0 flex justify-center pt-4 pb-2 bg-gray-50 z-10">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>
        
        <div className="overflow-y-auto">
          {/* Banner and Profile Header */}
          <div className="relative">
            {/* Banner Image */}
            <div className="h-36 bg-gradient-to-r from-gray-200 to-gray-300">
              {player.banner ? (
                <img src={player.banner} alt={`${displayName}'s banner`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-steel-blue/50 to-deep-sea/50"></div>
              )}
              {/* Overlay for readability */}
              <div className="absolute inset-0 bg-black/10" />
            </div>

            {/* Avatar */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-gray-50 shadow-lg">
                      <AvatarImage src={player.picture} alt={displayName} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 text-white text-3xl font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <OnlineStatusDot 
                      status={player.status} 
                      className="absolute bottom-1 right-1 w-6 h-6 border-4 border-gray-50 shadow-md"
                    />
                </div>
            </div>
          </div>
          
          <div className="pt-16 px-6 pb-8 bg-gray-50">
            {/* Name and Status */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 flex-wrap mb-2">
                <SheetTitle className="text-2xl font-bold text-gray-900">
                  {displayName}
                </SheetTitle>
                {player.nip05 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 border border-green-200/50 text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {player.lud16 && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-200/50 text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Lightning
                  </Badge>
                )}
              </div>
              <SheetDescription className="text-gray-500 font-medium text-base">
                {getStatusText()}
              </SheetDescription>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-8">
              <Button 
                onClick={handleBattleInvite}
                className="w-full bg-gradient-to-r from-ruby to-pink-500 hover:from-ruby/90 hover:to-pink-500/90 text-white py-3 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.99]"
              >
                <Gamepad2 className="w-5 h-5 mr-2" />
                Battle Invite
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleMessage}
                  className="py-3 rounded-xl font-semibold text-base bg-white border-gray-200/80 text-gray-800 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.99]"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Message
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleWallet}
                  className={`py-3 rounded-xl font-semibold text-base bg-white transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.99] ${
                    player.lud16 
                      ? 'border-gray-200/80 text-gray-800 hover:bg-gray-100 hover:border-gray-300' 
                      : 'border-gray-200/50 text-gray-400 bg-gray-100/20 cursor-not-allowed'
                  }`}
                  disabled={!player.lud16}
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  Wallet
                </Button>
              </div>
            </div>

            {/* Profile Information */}
            <div className="space-y-4">
              {player.about && (
                <div className="bg-white rounded-2xl p-5 border border-gray-200/50 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-2 text-base">About</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">{player.about}</p>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-bold text-gray-800 text-base px-1">Details</h3>
                
                {player.npub && (
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200/50 shadow-sm">
                    {/* Nostr ID detail content */}
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

                {player.lud16 && (
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200/50 shadow-sm">
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

                {player.nip05 && (
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200/50 shadow-sm">
                    {/* NIP-05 detail content */}
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

                {player.website && (
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200/50 shadow-sm">
                    {/* Website detail content */}
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

                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200/50 shadow-sm">
                  {/* Last Active detail content */}
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
