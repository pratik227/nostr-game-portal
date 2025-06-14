
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Zap } from 'lucide-react'

interface NostrLoginProps {
  onLogin: (pubkey: string) => void
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

export function NostrLogin({ onLogin }: NostrLoginProps) {
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
    script.onload = () => {
      setNostrLoginReady(true)
    }
    document.head.appendChild(script)

    // Listen for auth events
    const handleAuth = (e: any) => {
      console.log('Auth event:', e.detail)
      if (e.detail.type === 'login' || e.detail.type === 'signup') {
        handleLogin()
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

  const launchLogin = () => {
    if (nostrLoginReady) {
      document.dispatchEvent(new CustomEvent('nlLaunch', { detail: 'welcome' }))
    } else {
      handleLogin() // Fallback for extension login
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/20 backdrop-blur-lg border-purple-500/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Nostr Gaming Hub</CardTitle>
          <CardDescription className="text-gray-300">
            Connect your Nostr identity to access exclusive minigames
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={launchLogin}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            <User className="w-5 h-5 mr-2" />
            {isLoading ? 'Connecting...' : 'Connect with Nostr'}
          </Button>
          <p className="text-xs text-gray-400 text-center">
            Secure login with your Nostr keys or extension
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
