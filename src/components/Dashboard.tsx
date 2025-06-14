import { GameCard } from './GameCard'
import { Gamepad2, Zap, Target, Puzzle, Trophy } from 'lucide-react'
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
    gradient: 'from-yellow-500 to-orange-600'
  },
  {
    title: 'Nostr Puzzle',
    description: 'Solve cryptographic puzzles and compete with other players.',
    icon: Puzzle,
    status: 'coming-soon' as const,
    gradient: 'from-blue-500 to-purple-600'
  },
  {
    title: 'Target Master',
    description: 'Precision shooting game with leaderboards and rewards.',
    icon: Target,
    status: 'coming-soon' as const,
    gradient: 'from-green-500 to-teal-600'
  },
  {
    title: 'Arcade Classic',
    description: 'Retro-style arcade game with modern Nostr integration.',
    icon: Gamepad2,
    status: 'coming-soon' as const,
    gradient: 'from-pink-500 to-red-600'
  },
  {
    title: 'Tournament Arena',
    description: 'Compete in tournaments and climb the global rankings.',
    icon: Trophy,
    status: 'coming-soon' as const,
    gradient: 'from-purple-500 to-indigo-600'
  }
]

export function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-12 text-center animate-fade-in">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4">
          Nostr Game Center
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Your portal to a new era of decentralized gaming. Compete, earn, and own your progress.
        </p>
      </div>
      
      <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {games.map((game, index) => (
              <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <GameCard
                    title={game.title}
                    description={game.description}
                    icon={game.icon}
                    status={game.status}
                    gradient={game.gradient}
                    onClick={() => {
                      console.log(`${game.title} clicked - minigame will be implemented here`)
                    }}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="text-white bg-white/10 hover:bg-white/20 border-white/20 -left-4 sm:-left-8" />
          <CarouselNext className="text-white bg-white/10 hover:bg-white/20 border-white/20 -right-4 sm:-right-8" />
        </Carousel>
      </div>

      <div className="mt-16 text-center animate-fade-in" style={{ animationDelay: '400ms' }}>
        <div className="bg-gray-800/50 backdrop-blur-xl border border-purple-500/30 shadow-lg shadow-purple-500/10 rounded-xl p-8 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-3">The Future is Fun</h3>
          <p className="text-gray-400">
            We are building a vibrant ecosystem of games on Nostr.
            New titles and features are released regularly. Stay tuned!
          </p>
        </div>
      </div>
    </div>
  )
}
