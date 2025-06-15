
import { useState } from 'react';
import { useOnlinePlayers, OnlinePlayer } from '@/hooks/useOnlinePlayers';
import { PlayerAvatar } from './PlayerAvatar';
import { PlayerProfileSheet } from './PlayerProfileSheet';
import { RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface PlayersOnlineSectionProps {
  userPubkey: string;
}

export function PlayersOnlineSection({ userPubkey }: PlayersOnlineSectionProps) {
  const { onlinePlayers, loading, refreshOnlinePlayers } = useOnlinePlayers(userPubkey);
  const [selectedPlayer, setSelectedPlayer] = useState<OnlinePlayer | null>(null);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);

  const handlePlayerClick = (player: OnlinePlayer) => {
    console.log('Player clicked:', player);
    setSelectedPlayer(player);
    setIsProfileSheetOpen(true);
  };

  const handleProfileSheetClose = (open: boolean) => {
    setIsProfileSheetOpen(open);
    if (!open) {
      setSelectedPlayer(null);
    }
  };

  if (loading) {
    return (
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-shrink-0">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-deep-sea flex items-center gap-2">
            <Users className="w-5 h-5 text-steel-blue" />
            {onlinePlayers.length > 0 
              ? `${onlinePlayers.length} player${onlinePlayers.length !== 1 ? 's' : ''} online`
              : 'No players online'
            }
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshOnlinePlayers}
            className="w-8 h-8 p-0 text-steel-blue hover:text-deep-sea transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {onlinePlayers.length > 0 ? (
          <Carousel
            opts={{
              align: "start",
              dragFree: true,
            }}
            className="-ml-4"
          >
            <CarouselContent className="pb-3">
              {onlinePlayers.map((player) => (
                <CarouselItem key={player.id} className="basis-auto pl-4">
                    <PlayerAvatar
                      player={player}
                      onClick={() => handlePlayerClick(player)}
                    />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="text-center py-8 text-steel-blue">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-base font-medium mb-1">No players online right now</p>
            <p className="text-sm opacity-75">Check back soon or invite friends to play!</p>
          </div>
        )}
      </div>

      <PlayerProfileSheet
        player={selectedPlayer}
        isOpen={isProfileSheetOpen}
        onOpenChange={handleProfileSheetClose}
      />
    </>
  );
}
