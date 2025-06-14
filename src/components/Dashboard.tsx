
import { GameCard } from './GameCard'
import { Gamepad2, Zap, Target, Puzzle, Trophy, Sparkles, Users, Bitcoin, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const games = [
  {
    title: 'Lightning Strike',
    description: 'Fast reflexes = Fast sats!',
    icon: Zap,
    status: 'coming-soon' as const,
    gradient: 'from-gold to-yellow-400'
  },
  {
    title: 'Nostr Puzzle',
    description: 'Outsmart the competition',
    icon: Puzzle,
    status: 'coming-soon' as const,
    gradient: 'from-steel-blue to-deep-sea'
  },
  {
    title: 'Target Master',
    description: 'Precision pays off',
    icon: Target,
    status: 'coming-soon' as const,
    gradient: 'from-teal to-cyan-500'
  },
  {
    title: 'Arcade Classic',
    description: 'Retro vibes, real rewards',
    icon: Gamepad2,
    status: 'coming-soon' as const,
    gradient: 'from-ruby to-red-500'
  }
]

interface DashboardProps {
  onPlayClick: () => void;
}

export function Dashboard({ onPlayClick }: DashboardProps) {
  return (
    <div className="max-w-md mx-auto p-4 pb-8">
      {/* Hero Section */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gold to-yellow-400 rounded-3xl mb-4 shadow-2xl">
          <Sparkles className="w-10 h-10 text-deep-sea" />
        </div>
        <h1 className="text-3xl font-black text-deep-sea mb-2 tracking-tight">
          Ready to Win?
        </h1>
        <p className="text-steel-blue text-sm leading-relaxed mb-6">
          Challenge friends • Earn sats • Dominate leaderboards
        </p>
        
        <Button
          onClick={onPlayClick}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-gold to-yellow-400 hover:from-gold/90 hover:to-yellow-400/90 text-deep-sea rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-200"
        >
          <Gamepad2 className="w-6 h-6 mr-3" />
          Start Playing Now
        </Button>
      </div>

      {/* Value Props */}
      <div className="grid grid-cols-3 gap-3 mb-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl">
          <Users className="w-8 h-8 text-teal mx-auto mb-2" />
          <p className="text-xs font-bold text-deep-sea">Challenge</p>
          <p className="text-xs text-steel-blue">Friends</p>
        </div>
        <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl">
          <Bitcoin className="w-8 h-8 text-gold mx-auto mb-2" />
          <p className="text-xs font-bold text-deep-sea">Win</p>
          <p className="text-xs text-steel-blue">Sats</p>
        </div>
        <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl">
          <Globe className="w-8 h-8 text-steel-blue mx-auto mb-2" />
          <p className="text-xs font-bold text-deep-sea">Global</p>
          <p className="text-xs text-steel-blue">Compete</p>
        </div>
      </div>
      
      {/* Games Preview */}
      <div className="animate-fade-in mb-6" style={{ animationDelay: '400ms' }}>
        <h2 className="text-xl font-bold text-deep-sea mb-4 text-center">Choose Your Battle</h2>
        <Carousel
          opts={{
            align: "center",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {games.map((game, index) => (
              <CarouselItem key={index} className="pl-2 basis-4/5">
                <div className="h-32">
                  <GameCard
                    title={game.title}
                    description={game.description}
                    icon={game.icon}
                    status={game.status}
                    gradient={game.gradient}
                    onClick={onPlayClick}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="text-deep-sea bg-white/80 hover:bg-white border-gray-200 shadow-md -left-2" />
          <CarouselNext className="text-deep-sea bg-white/80 hover:bg-white border-gray-200 shadow-md -right-2" />
        </Carousel>
      </div>

      {/* CTA Section */}
      <div className="text-center animate-fade-in" style={{ animationDelay: '600ms' }}>
        <div className="bg-gradient-to-br from-deep-sea to-steel-blue text-white p-6 rounded-3xl shadow-xl">
          <Trophy className="w-12 h-12 text-gold mx-auto mb-3" />
          <h3 className="text-lg font-bold mb-2">Join the Competition</h3>
          <p className="text-sm text-white/90 mb-4">
            Connect with Nostr. Play instantly. Win rewards.
          </p>
          <Button
            onClick={onPlayClick}
            className="w-full bg-gold hover:bg-gold/90 text-deep-sea font-bold h-12 rounded-xl"
          >
            Connect & Play
          </Button>
        </div>
      </div>
    </div>
  )
}
