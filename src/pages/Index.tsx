
import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Dashboard } from '@/components/Dashboard'
import { Profile } from '@/components/Profile'
import { getProfileFromPubkey } from "@/lib/nostr";
import { useNostrSupabaseLogin, type SupabaseUser } from "@/hooks/useNostrSupabaseLogin"

// This declaration is needed to inform TypeScript about the nostr object
declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>
    }
  }
}

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [pubkey, setPubkey] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'profile'>('dashboard')
  const [profileReloadKey, setProfileReloadKey] = useState(0)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const { loginOrSignup, isProcessing, error } = useNostrSupabaseLogin();

  useEffect(() => {
    // Check if user is already logged in
    const checkExistingLogin = async () => {
      try {
        if (window.nostr) {
          const pk = await window.nostr.getPublicKey()
          if (pk) {
            handleLogin(pk, false)
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
    
    const handleNLLogout = () => handleLogout(false)
    document.addEventListener('nlLogout', handleNLLogout)

    return () => {
      document.removeEventListener('nlAuth', handleAuth)
      document.removeEventListener('nlLogout', handleNLLogout)
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  const handleLogin = async (userPubkey: string, closeModal = true) => {
    setPubkey(userPubkey);
    setIsLoggedIn(true);
    console.log("User logged in with pubkey:", userPubkey);
    const nostrProfile = await getProfileFromPubkey(userPubkey);
    const user = await loginOrSignup(userPubkey, nostrProfile || {});
    setSupabaseUser(user);
  };

  const handleSignup = async (userPubkey: string) => {
    setPubkey(userPubkey);
    setIsLoggedIn(true);
    setProfileReloadKey((prev) => prev + 1);
    console.log("User signed up with pubkey:", userPubkey, "Profile will be reloaded");
    const nostrProfile = await getProfileFromPubkey(userPubkey);
    const user = await loginOrSignup(userPubkey, nostrProfile || {});
    setSupabaseUser(user);
  };

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
      launchNostrLoginForm()
    } else {
      setCurrentPage(page)
    }
  }

  const handlePlayClick = () => {
    if (!isLoggedIn) {
      launchNostrLoginForm()
    } else {
      console.log("User is logged in. Ready to play!");
    }
  }

  const launchNostrLoginForm = () => {
    document.dispatchEvent(new CustomEvent('nlLaunch', { detail: 'welcome' }));
  }

  return (
    <div className="min-h-screen bg-background text-deep-sea">
      <Navbar
        isLoggedIn={isLoggedIn}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onLoginClick={launchNostrLoginForm}
        pubkey={pubkey}
      />
      
      <main className="pt-4">
        {currentPage === 'dashboard' ? (
          <Dashboard onPlayClick={handlePlayClick} />
        ) : (
          <Profile pubkey={pubkey} key={profileReloadKey} />
        )}
      </main>
    </div>
  )
}
