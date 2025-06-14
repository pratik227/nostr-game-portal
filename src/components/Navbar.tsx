
import { Button } from '@/components/ui/button'
import { User, Home, LogOut, Gamepad2 } from 'lucide-react'
import { formatPubkey } from '@/lib/nostr'

interface NavbarProps {
  currentPage: 'dashboard' | 'profile'
  onNavigate: (page: 'dashboard' | 'profile') => void
  onLogout: () => void
  pubkey: string
}

export function Navbar({ currentPage, onNavigate, onLogout, pubkey }: NavbarProps) {
  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <Gamepad2 className="text-white w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">Nostr Gaming</span>
              <p className="text-xs text-gray-500 -mt-1">Decentralized Fun</p>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center space-x-2">
            <Button
              variant={currentPage === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => onNavigate('dashboard')}
              className={`${
                currentPage === 'dashboard' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                  : 'text-gray-700 hover:bg-gray-100'
              } rounded-lg transition-all duration-200`}
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            
            <Button
              variant={currentPage === 'profile' ? 'default' : 'ghost'}
              onClick={() => onNavigate('profile')}
              className={`${
                currentPage === 'profile' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                  : 'text-gray-700 hover:bg-gray-100'
              } rounded-lg transition-all duration-200`}
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            
            {/* User Info */}
            <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
              <div className="text-sm">
                <p className="text-gray-900 font-medium">Connected</p>
                <p className="text-gray-500 text-xs">{formatPubkey(pubkey).slice(0, 12)}...</p>
              </div>
              
              <Button
                variant="ghost"
                onClick={onLogout}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
