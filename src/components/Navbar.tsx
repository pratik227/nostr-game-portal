
import { Button } from '@/components/ui/button'
import { User, Home, LogOut, Gamepad2 } from 'lucide-react'

interface NavbarProps {
  isLoggedIn: boolean;
  currentPage: 'dashboard' | 'profile'
  onNavigate: (page: 'dashboard' | 'profile') => void
  onLogout: () => void
  onLoginClick: () => void
  pubkey: string
}

export function Navbar({ isLoggedIn, currentPage, onNavigate, onLogout, onLoginClick }: NavbarProps) {
  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 bg-gradient-to-br from-steel-blue to-deep-sea rounded-xl flex items-center justify-center shadow-md">
              <Gamepad2 className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-deep-sea hidden sm:block">Nostr Gaming</span>
          </div>
          
          {/* Navigation & User Section */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {isLoggedIn ? (
              <>
                <Button
                  variant={currentPage === 'dashboard' ? 'secondary' : 'ghost'}
                  onClick={() => onNavigate('dashboard')}
                  className="font-semibold rounded-lg"
                >
                  <Home className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
                
                <Button
                  variant={currentPage === 'profile' ? 'secondary' : 'ghost'}
                  onClick={() => onNavigate('profile')}
                  className="font-semibold rounded-lg"
                >
                  <User className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
                
                <div className="pl-2 ml-2 border-l border-gray-200">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onLogout}
                    className="text-ruby hover:bg-ruby/10 hover:text-ruby rounded-full"
                    aria-label="Log out"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              </>
            ) : (
              <Button
                onClick={onLoginClick}
                className="bg-gold hover:bg-gold/90 text-deep-sea font-bold shadow-sm rounded-lg"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
