import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Dashboard } from '@/components/Dashboard'
import { Profile } from '@/components/Profile'
import { GameHub } from '@/pages/GameHub'
import { getProfileFromPubkey } from "@/lib/nostr";
import { useNostrSupabaseLogin, type SupabaseUser } from "@/hooks/useNostrSupabaseLogin"
import { updateLastSeenWithProfile, syncUserProfile } from '@/utils/profileSync';

// This declaration is needed to inform TypeScript about the nostr object
declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>
      signEvent(event: any): Promise<any>
    }
  }
}

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [pubkey, setPubkey] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'profile' | 'gamehub'>('dashboard')
  const [profileReloadKey, setProfileReloadKey] = useState(0)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [wasLoggedInBefore, setWasLoggedInBefore] = useState(false);
  const { loginOrSignup, isProcessing, error } = useNostrSupabaseLogin();

  useEffect(() => {
    let scriptLoaded = false;

    // Check if user was logged in before
    const checkExistingLogin = async () => {
      try {
        if (window.nostr) {
          const pk = await window.nostr.getPublicKey()
          if (pk) {
            setWasLoggedInBefore(true);
            handleLogin(pk, false)
          }
        }
      } catch (error) {
        console.log('No existing login found')
        setWasLoggedInBefore(false);
      }
    }

    // Load nostr-login script only once
    if (!document.querySelector('script[src*="nostr-login"]') && !scriptLoaded) {
      const script = document.createElement('script')
      script.src = 'https://www.unpkg.com/nostr-login@latest/dist/unpkg.js'
      script.setAttribute('data-theme', 'ocean') // Updated to ocean theme for cleaner colors
      script.setAttribute('data-perms', 'sign_event:1,sign_event:0')
      script.setAttribute('data-title', 'Nostr Gaming Hub')
      script.setAttribute('data-description', 'Connect your Nostr identity to access minigames')
      script.setAttribute('data-no-banner', 'false')
      
      script.onload = () => {
        scriptLoaded = true;
        checkExistingLogin()
      }
      
      document.head.appendChild(script)
    } else {
      checkExistingLogin()
    }

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
    
    const handleNLLogout = () => handleLogout(false)

    // Add event listeners only if not already added
    document.addEventListener('nlAuth', handleAuth)
    document.addEventListener('nlLogout', handleNLLogout)

    return () => {
      document.removeEventListener('nlAuth', handleAuth)
      document.removeEventListener('nlLogout', handleNLLogout)
    }
  }, [])

  const handleLogin = async (userPubkey: string, closeModal = true) => {
    setPubkey(userPubkey);
    localStorage.setItem('userPubkey', userPubkey); // Store for friends list
    setIsLoggedIn(true);
    setCurrentPage('gamehub'); // Navigate to GameHub after login
    console.log("User logged in with pubkey:", userPubkey);
    
    // Get profile data and sync it with database
    const nostrProfile = await getProfileFromPubkey(userPubkey);
    const user = await loginOrSignup(userPubkey, nostrProfile || {});
    setSupabaseUser(user);
    
    // Update last seen with profile data
    await updateLastSeenWithProfile(userPubkey, nostrProfile || {});
  };

  const handleSignup = async (userPubkey: string) => {
    setPubkey(userPubkey);
    localStorage.setItem('userPubkey', userPubkey); // Store for friends list
    setIsLoggedIn(true);
    setCurrentPage('gamehub'); // Navigate to GameHub after signup
    setProfileReloadKey((prev) => prev + 1);
    console.log("User signed up with pubkey:", userPubkey, "Profile will be reloaded");
    
    // Get profile data and sync it with database
    const nostrProfile = await getProfileFromPubkey(userPubkey);
    const user = await loginOrSignup(userPubkey, nostrProfile || {});
    setSupabaseUser(user);
    
    // Update last seen with profile data
    await updateLastSeenWithProfile(userPubkey, nostrProfile || {});
    
    // Show key management interface for new users
    setTimeout(() => {
      showKeyManagement();
    }, 1000); // Small delay to ensure the user is fully set up
  };

  // Add periodic profile sync for current user
  useEffect(() => {
    if (isLoggedIn && pubkey) {
      // Sync profile every 5 minutes
      const intervalId = setInterval(() => {
        syncUserProfile(pubkey);
      }, 5 * 60 * 1000);

      return () => clearInterval(intervalId);
    }
  }, [isLoggedIn, pubkey]);

  const showKeyManagement = () => {
    // Launch the nostr-login key management interface
    document.dispatchEvent(new CustomEvent('nlLaunch', { detail: 'options' }));
  };

  const handleLogout = (dispatchEvent = true) => {
    if (dispatchEvent) {
      document.dispatchEvent(new Event("nlLogout"))
    }
    setIsLoggedIn(false)
    setPubkey('')
    localStorage.removeItem('userPubkey') // Clear stored pubkey
    setCurrentPage('dashboard')
    setProfileReloadKey(0)
    setWasLoggedInBefore(false)
    console.log('User logged out')
  }

  const handleNavigate = (page: 'dashboard' | 'profile' | 'gamehub') => {
    if ((page === 'profile' || page === 'gamehub') && !isLoggedIn) {
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
    // Show different modals based on previous login status
    const startScreen = wasLoggedInBefore ? 'switch-account' : 'welcome';
    console.log('Launching nostr login with screen:', startScreen);
    document.dispatchEvent(new CustomEvent('nlLaunch', { detail: startScreen }));
  }

  const renderCurrentPage = () => {
    if (!isLoggedIn) {
      // Show dashboard for non-logged-in users
      return <Dashboard onPlayClick={handlePlayClick} />;
    }

    // Show appropriate page for logged-in users
    switch (currentPage) {
      case 'profile':
        return <Profile pubkey={pubkey} key={profileReloadKey} onBack={() => setCurrentPage('gamehub')} />;
      case 'gamehub':
        return (
          <GameHub 
            onLogout={handleLogout}
            onNavigateToProfile={() => setCurrentPage('profile')}
          />
        );
      default:
        return (
          <GameHub 
            onLogout={handleLogout}
            onNavigateToProfile={() => setCurrentPage('profile')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-deep-sea">
      {!isLoggedIn && (
        <Navbar
          isLoggedIn={isLoggedIn}
          currentPage={currentPage as 'dashboard' | 'profile'}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onLoginClick={launchNostrLoginForm}
          pubkey={pubkey}
        />
      )}
      
      <main className={!isLoggedIn ? "pt-4" : ""}>
        {renderCurrentPage()}
      </main>
    </div>
  )
}
