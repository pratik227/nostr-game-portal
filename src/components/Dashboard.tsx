
import { GameCard } from './GameCard'
import { Gamepad2, Zap, Target, Puzzle, Trophy, Sparkles } from 'lucide-react'
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
    description: 'Fast-paced reaction game. Test your reflexes and earn sats!',
    icon: Zap,
    status: 'coming-soon' as const,
    gradient: 'from-gold to-yellow-400'
  },
  {
    title: 'Nostr Puzzle',
    description: 'Solve cryptographic puzzles and compete with other players.',
    icon: Puzzle,
    status: 'coming-soon' as const,
    gradient: 'from-steel-blue to-deep-sea'
  },
  {
    title: 'Target Master',
    description: 'Precision shooting game with leaderboards and rewards.',
    icon: Target,
    status: 'coming-soon' as const,
    gradient: 'from-teal to-cyan-500'
  },
  {
    title: 'Arcade Classic',
    description: 'Retro-style arcade game with modern Nostr integration.',
    icon: Gamepad2,
    status: 'coming-soon' as const,
    gradient: 'from-ruby to-red-500'
  },
  {
    title: 'Tournament Arena',
    description: 'Compete in tournaments and climb the global rankings.',
    icon: Trophy,
    status: 'coming-soon' as const,
    gradient: 'from-gray-700 to-gray-900'
  }
]

interface DashboardProps {
  onPlayClick: () => void;
}

export function Dashboard({ onPlayClick }: DashboardProps) {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-steel-blue to-deep-sea rounded-2xl mb-6 shadow-lg">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-deep-sea mb-4 tracking-tight">
          Game Center
        </h1>
        <p className="text-lg text-steel-blue max-w-3xl mx-auto leading-relaxed">
          Your portal to decentralized gaming. Compete, earn, and own your progress on the Nostr network.
        </p>
      </div>
      
      {/* Games Carousel */}
      <div className="animate-fade-in mb-16" style={{ animationDelay: '200ms' }}>
        <h2 className="text-3xl font-semibold text-deep-sea mb-8 text-center">Featured Games</h2>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4 sm:-ml-6">
            {games.map((game, index) => (
              <CarouselItem key={index} className="pl-4 sm:pl-6 md:basis-1/2 lg:basis-1/3">
                <GameCard
                  title={game.title}
                  description={game.description}
                  icon={game.icon}
                  status={game.status}
                  gradient={game.gradient}
                  onClick={onPlayClick}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="text-deep-sea bg-white/80 hover:bg-white border-gray-200 shadow-md -left-3 sm:-left-4" />
          <CarouselNext className="text-deep-sea bg-white/80 hover:bg-white border-gray-200 shadow-md -right-3 sm:-right-4" />
        </Carousel>
      </div>

      {/* Info Section */}
      <div className="text-center animate-fade-in" style={{ animationDelay: '400ms' }}>
        <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-2xl p-8 max-w-3xl mx-auto">
          <h3 className="text-2xl font-semibold text-deep-sea mb-3">The Future of Gaming is Here</h3>
          <p className="text-steel-blue leading-relaxed">
            We're building a vibrant ecosystem of games on the Nostr protocol. 
            Experience true ownership of your gaming achievements and connect with players worldwide.
          </p>
        </div>
      </div>
    </div>
  )
}
