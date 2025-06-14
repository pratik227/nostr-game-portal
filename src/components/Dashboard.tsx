
import { GameCard } from './GameCard'
import { Gamepad2, Zap, Target, Puzzle, Trophy } from 'lucide-react'

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
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Gaming Dashboard</h1>
        <p className="text-gray-300 text-lg">Choose your adventure in the Nostr gaming ecosystem</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game, index) => (
          <GameCard
            key={index}
            title={game.title}
            description={game.description}
            icon={game.icon}
            status={game.status}
            gradient={game.gradient}
            onClick={() => {
              console.log(`${game.title} clicked - minigame will be implemented here`)
            }}
          />
        ))}
      </div>
      
      <div className="mt-12 text-center">
        <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-purple-500/20">
          <h3 className="text-xl font-semibold text-white mb-2">More Games Coming Soon!</h3>
          <p className="text-gray-300">
            We're constantly adding new minigames to the platform. 
            Stay tuned for exciting updates and new ways to earn and play.
          </p>
        </div>
      </div>
    </div>
  )
}
