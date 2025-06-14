
import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Dashboard } from '@/components/Dashboard'
import { Profile } from '@/components/Profile'
import { LoginModal } from '@/components/LoginModal'

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [pubkey, setPubkey] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'profile'>('dashboard')
  const [profileReloadKey, setProfileReloadKey] = useState(0)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    const checkExistingLogin = async () => {
      try {
        if (window.nostr) {
          const pk = await window.nostr.getPublicKey()
          if (pk) {
            handleLogin(pk, false) // handle login without closing modal
          }
        }
      } catch (error) {
        console.log('No existing login found')
      }
    }

    // Load nostr-login script and set up listeners
    const script = document.createElement('script')
    script.src = 'https://www.unpkg.com/nostr-login@latest/dist/unpkg.js'
    script.setAttribute('data-theme', 'purple')
    script.setAttribute('data-perms', 'sign_event:1,sign_event:0')
    script.setAttribute('data-title', 'Nostr Gaming Hub')
    script.setAttribute('data-description', 'Connect your Nostr identity to access minigames')
    script.setAttribute('data-no-banner', 'true')
    script.onload = () => {
      checkExistingLogin()
    }
    document.head.appendChild(script)

    const handleAuth = async (e: any) => {
      console.log('Auth event:', e.detail)
      try {
        if (window.nostr) {
          const pk = await window.nostr.getPublicKey();
          if (e.detail.type === 'login') {
            handleLogin(pk)
          } else if (e.detail.type === 'signup') {
            handleSignup(pk)
          }
        }
      } catch (error) {
        console.error("Failed to get public key after auth event", error);
      }
    }
    document.addEventListener('nlAuth', handleAuth)
    
    // Also listen to nostr-login's own logout event
    const handleNLLogout = () => handleLogout(false) // Don't re-dispatch event
    document.addEventListener('nlLogout', handleNLLogout)

    return () => {
      document.removeEventListener('nlAuth', handleAuth)
      document.removeEventListener('nlLogout', handleNLLogout)
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  const handleLogin = (userPubkey: string, closeModal = true) => {
    setPubkey(userPubkey)
    setIsLoggedIn(true)
    if (closeModal) setShowLoginModal(false)
    console.log('User logged in with pubkey:', userPubkey)
  }

  const handleSignup = (userPubkey: string) => {
    setPubkey(userPubkey)
    setIsLoggedIn(true)
    setShowLoginModal(false)
    // Trigger profile reload after signup to fetch the new name
    setProfileReloadKey(prev => prev + 1)
    console.log('User signed up with pubkey:', userPubkey, 'Profile will be reloaded')
  }

  const handleLogout = (dispatchEvent = true) => {
    if (dispatchEvent) {
      document.dispatchEvent(new Event("nlLogout"))
    }
    setIsLoggedIn(false)
    setPubkey('')
    setCurrentPage('dashboard')
    setProfileReloadKey(0)
    console.log('User logged out')
  }

  const handleNavigate = (page: 'dashboard' | 'profile') => {
    if (page === 'profile' && !isLoggedIn) {
      setShowLoginModal(true)
    } else {
      setCurrentPage(page)
    }
  }

  const handlePlayClick = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
    } else {
      console.log("User is logged in. Ready to play!");
      // Here you would navigate to the actual game screen
    }
  }

  return (
    <div className="min-h-screen bg-background text-deep-sea">
      <Navbar
        isLoggedIn={isLoggedIn}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onLoginClick={() => setShowLoginModal(true)}
        pubkey={pubkey}
      />
      
      <main className="pt-4">
        {currentPage === 'dashboard' ? (
          <Dashboard onPlayClick={handlePlayClick} />
        ) : (
          <Profile pubkey={pubkey} key={profileReloadKey} />
        )}
      </main>

      <LoginModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal}
        onLaunchNostrLogin={() => document.dispatchEvent(new CustomEvent('nlLaunch', { detail: 'welcome' }))}
      />
    </div>
  )
}
