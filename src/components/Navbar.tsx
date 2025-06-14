
import { Button } from '@/components/ui/button'
import { User, Home, LogOut } from 'lucide-react'
import { formatPubkey } from '@/lib/nostr'

interface NavbarProps {
  currentPage: 'dashboard' | 'profile'
  onNavigate: (page: 'dashboard' | 'profile') => void
  onLogout: () => void
  pubkey: string
}

export function Navbar({ currentPage, onNavigate, onLogout, pubkey }: NavbarProps) {
  return (
    <nav className="bg-black/20 backdrop-blur-lg border-b border-purple-500/20 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="text-white font-bold text-lg">Nostr Gaming</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant={currentPage === 'dashboard' ? 'default' : 'ghost'}
            onClick={() => onNavigate('dashboard')}
            className={currentPage === 'dashboard' ? 'bg-purple-600 hover:bg-purple-700' : 'text-white hover:bg-white/10'}
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          
          <Button
            variant={currentPage === 'profile' ? 'default' : 'ghost'}
            onClick={() => onNavigate('profile')}
            className={currentPage === 'profile' ? 'bg-purple-600 hover:bg-purple-700' : 'text-white hover:bg-white/10'}
          >
            <User className="w-4 h-4 mr-2" />
            Profile
          </Button>
          
          <div className="flex items-center space-x-2 text-sm text-gray-300 bg-white/5 px-3 py-1 rounded-lg">
            <span>{formatPubkey(pubkey).slice(0, 12)}...</span>
          </div>
          
          <Button
            variant="ghost"
            onClick={onLogout}
            className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  )
}
