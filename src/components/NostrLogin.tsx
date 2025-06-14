
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Zap } from 'lucide-react'

interface NostrLoginProps {
  onLogin: (pubkey: string) => void
  onSignup: (pubkey: string) => void
}

declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>
      signEvent(event: any): Promise<any>
      getRelays?(): Promise<Record<string, {read: boolean, write: boolean}>>
      nip04?: {
        encrypt(pubkey: string, plaintext: string): Promise<string>
        decrypt(pubkey: string, ciphertext: string): Promise<string>
      }
    }
  }
}

export function NostrLogin({ onLogin, onSignup }: NostrLoginProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [nostrLoginReady, setNostrLoginReady] = useState(false)

  useEffect(() => {
    // Load nostr-login script
    const script = document.createElement('script')
    script.src = 'https://www.unpkg.com/nostr-login@latest/dist/unpkg.js'
    script.setAttribute('data-theme', 'purple')
    script.setAttribute('data-perms', 'sign_event:1,sign_event:0')
    script.setAttribute('data-title', 'Nostr Gaming Hub')
    script.setAttribute('data-description', 'Connect your Nostr identity to access minigames')
    script.setAttribute('data-no-banner', 'true') // Disable the nostr-login banner
    script.onload = () => {
      setNostrLoginReady(true)
    }
    document.head.appendChild(script)

    // Listen for auth events
    const handleAuth = (e: any) => {
      console.log('Auth event:', e.detail)
      if (e.detail.type === 'login') {
        handleLogin()
      } else if (e.detail.type === 'signup') {
        handleSignup()
      }
    }

    document.addEventListener('nlAuth', handleAuth)

    return () => {
      document.removeEventListener('nlAuth', handleAuth)
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      if (window.nostr) {
        const pubkey = await window.nostr.getPublicKey()
        onLogin(pubkey)
      }
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async () => {
    setIsLoading(true)
    try {
      if (window.nostr) {
        const pubkey = await window.nostr.getPublicKey()
        onSignup(pubkey)
      }
    } catch (error) {
      console.error('Signup failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const launchLogin = () => {
    if (nostrLoginReady) {
      document.dispatchEvent(new CustomEvent('nlLaunch', { detail: 'welcome' }))
    } else {
      handleLogin() // Fallback for extension login
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm">
        <Card className="bg-gray-800/50 backdrop-blur-xl border border-purple-500/30 shadow-2xl shadow-purple-500/10 animate-fade-in">
          <CardHeader className="items-center text-center p-8">
            <div className="p-4 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl mb-6">
              <Zap size={40} className="text-white" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">
              Welcome to Nostr Gaming
            </CardTitle>
            <CardDescription className="text-gray-400 max-w-xs mx-auto pt-2">
              Unlock a world of decentralized games. Connect securely with your Nostr identity.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Button
              onClick={launchLogin}
              disabled={isLoading}
              className="w-full text-lg py-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-600/20"
            >
              {isLoading ? (
                'Connecting...'
              ) : (
                <>
                  <User className="mr-2 h-5 w-5" />
                  Connect with Nostr
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center mt-4">
              Uses NIP-07 browser extension or NIP-46 remote signing.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
