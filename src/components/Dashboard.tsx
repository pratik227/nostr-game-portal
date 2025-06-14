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
import Autoplay from "embla-carousel-autoplay"

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
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Hero Section */}
      <div className="text-center mb-12 md:mb-16 animate-fade-in">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gold to-yellow-400 rounded-full mb-6 shadow-2xl ring-4 ring-gold/20">
          <Sparkles className="w-12 h-12 text-deep-sea" />
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-deep-sea mb-4 tracking-tighter">
          Ready to Win Sats?
        </h1>
        <p className="max-w-2xl mx-auto text-steel-blue text-base md:text-lg leading-relaxed mb-8">
          Challenge friends, earn sats, and dominate the leaderboards in our skill-based games.
        </p>
        
        <Button
          onClick={onPlayClick}
          size="lg"
          className="w-full sm:w-auto h-16 text-xl font-bold bg-gradient-to-r from-gold to-yellow-400 hover:from-gold/90 hover:to-yellow-400/90 text-deep-sea rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-[1.03] transition-all duration-300 ease-in-out px-10"
        >
          <Gamepad2 className="w-8 h-8 mr-3" />
          Start Playing Now
        </Button>
      </div>

      {/* Games Preview */}
      <div className="animate-fade-in mb-12 md:mb-16" style={{ animationDelay: '200ms' }}>
        <h2 className="text-3xl md:text-4xl font-bold text-deep-sea mb-6 text-center tracking-tight">Choose Your Battle</h2>
        <Carousel
          opts={{
            align: "center",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 4000,
              stopOnInteraction: true,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {games.map((game, index) => (
              <CarouselItem key={index} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                <div className="h-40">
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
          <CarouselPrevious className="text-deep-sea bg-white/80 hover:bg-white border-gray-200 shadow-md -left-4 disabled:opacity-50" />
          <CarouselNext className="text-deep-sea bg-white/80 hover:bg-white border-gray-200 shadow-md -right-4 disabled:opacity-50" />
        </Carousel>
      </div>
      
      {/* Value Props */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16 animate-fade-in" style={{ animationDelay: '400ms' }}>
        <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg">
          <Users className="w-10 h-10 text-teal mx-auto mb-3" />
          <p className="text-lg font-bold text-deep-sea">Challenge Friends</p>
          <p className="text-sm text-steel-blue">Compete 1-on-1</p>
        </div>
        <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg">
          <Bitcoin className="w-10 h-10 text-gold mx-auto mb-3" />
          <p className="text-lg font-bold text-deep-sea">Win Sats</p>
          <p className="text-sm text-steel-blue">Real Bitcoin rewards</p>
        </div>
        <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg">
          <Globe className="w-10 h-10 text-steel-blue mx-auto mb-3" />
          <p className="text-lg font-bold text-deep-sea">Global Leaderboards</p>
          <p className="text-sm text-steel-blue">Prove you're the best</p>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="text-center animate-fade-in" style={{ animationDelay: '600ms' }}>
        <div className="bg-gradient-to-br from-deep-sea to-steel-blue text-white p-8 md:p-10 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full opacity-50"></div>
            <div className="absolute -bottom-16 -left-8 w-48 h-48 bg-white/10 rounded-full opacity-50"></div>
          <div className="relative z-10">
            <Trophy className="w-16 h-16 text-gold mx-auto mb-4" />
            <h3 className="text-2xl md:text-3xl font-bold mb-3">Join the Competition</h3>
            <p className="text-base text-white/90 mb-6 max-w-md mx-auto">
              Connect with your Nostr account to play instantly and start winning real rewards.
            </p>
            <Button
              onClick={onPlayClick}
              size="lg"
              className="w-full sm:w-auto bg-gold hover:bg-gold/90 text-deep-sea font-bold h-14 rounded-2xl px-8"
            >
              Connect & Play
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
