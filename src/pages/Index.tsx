
import { useState, useEffect } from 'react'
import { NostrLogin } from '@/components/NostrLogin'
import { Navbar } from '@/components/Navbar'
import { Dashboard } from '@/components/Dashboard'
import { Profile } from '@/components/Profile'

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [pubkey, setPubkey] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'profile'>('dashboard')

  useEffect(() => {
    // Check if user is already logged in (stored in localStorage by nostr-login)
    const checkExistingLogin = async () => {
      try {
        if (window.nostr) {
          const pk = await window.nostr.getPublicKey()
          if (pk) {
            setPubkey(pk)
            setIsLoggedIn(true)
          }
        }
      } catch (error) {
        console.log('No existing login found')
      }
    }

    checkExistingLogin()
  }, [])

  const handleLogin = (userPubkey: string) => {
    setPubkey(userPubkey)
    setIsLoggedIn(true)
    console.log('User logged in with pubkey:', userPubkey)
  }

  const handleLogout = () => {
    // Dispatch logout event to nostr-login
    document.dispatchEvent(new Event("nlLogout"))
    
    setIsLoggedIn(false)
    setPubkey('')
    setCurrentPage('dashboard')
    console.log('User logged out')
  }

  const handleNavigate = (page: 'dashboard' | 'profile') => {
    setCurrentPage(page)
  }

  if (!isLoggedIn) {
    return <NostrLogin onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        pubkey={pubkey}
      />
      
      <main className="pt-6">
        {currentPage === 'dashboard' ? (
          <Dashboard />
        ) : (
          <Profile pubkey={pubkey} />
        )}
      </main>
    </div>
  )
}
