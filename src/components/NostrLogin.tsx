
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Zap, Shield, Gamepad2 } from 'lucide-react'

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
    script.setAttribute('data-no-banner', 'true')
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
      handleLogin()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-lg">
            <Gamepad2 size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Welcome to Nostr Gaming
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Connect with your decentralized identity and unlock a world of gaming experiences
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-xl shadow-gray-200/20">
          <CardHeader className="text-center pb-6 pt-8 px-8">
            <CardTitle className="text-2xl font-semibold text-gray-900 mb-2">
              Get Started
            </CardTitle>
            <CardDescription className="text-gray-600">
              Secure, decentralized authentication via Nostr protocol
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <Button
              onClick={launchLogin}
              disabled={isLoading}
              className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Connecting...
                </div>
              ) : (
                <>
                  <User className="mr-2 h-5 w-5" />
                  Connect with Nostr
                </>
              )}
            </Button>
            
            {/* Features */}
            <div className="mt-8 space-y-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Secure & Private</p>
                  <p className="text-xs text-gray-600">Your keys, your identity</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Zap className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Lightning Fast</p>
                  <p className="text-xs text-gray-600">Instant authentication</p>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-6">
              Uses NIP-07 browser extension or NIP-46 remote signing
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
