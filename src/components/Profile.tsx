
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Globe, Mail, Copy, ExternalLink } from 'lucide-react'
import { getProfileFromPubkey, getProfileFromNip05, formatPubkey, NostrProfile } from '@/lib/nostr'
import { toast } from 'sonner'

interface ProfileProps {
  pubkey: string
}

export function Profile({ pubkey }: ProfileProps) {
  const [profile, setProfile] = useState<NostrProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [nip05Input, setNip05Input] = useState('')
  const [nip05Loading, setNip05Loading] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [pubkey])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const profileData = await getProfileFromPubkey(pubkey)
      setProfile(profileData)
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const loadNip05Profile = async () => {
    if (!nip05Input.trim()) {
      toast.error('Please enter a valid NIP-05 address')
      return
    }

    setNip05Loading(true)
    try {
      const result = await getProfileFromNip05(nip05Input.trim())
      if (result) {
        setProfile(result.profile)
        toast.success('NIP-05 profile loaded successfully')
      } else {
        toast.error('NIP-05 profile not found')
      }
    } catch (error) {
      console.error('Error loading NIP-05 profile:', error)
      toast.error('Failed to load NIP-05 profile')
    } finally {
      setNip05Loading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const npub = formatPubkey(pubkey)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Nostr Profile</h1>
        <p className="text-gray-300 text-lg">Your identity on the decentralized web</p>
      </div>

      {/* NIP-05 Lookup Section */}
      <Card className="mb-6 bg-black/20 backdrop-blur-lg border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Load Profile from NIP-05
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="nip05" className="text-gray-300">NIP-05 Address</Label>
              <Input
                id="nip05"
                placeholder="username@domain.com"
                value={nip05Input}
                onChange={(e) => setNip05Input(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <Button
              onClick={loadNip05Profile}
              disabled={nip05Loading}
              className="bg-purple-600 hover:bg-purple-700 mt-6"
            >
              {nip05Loading ? 'Loading...' : 'Load Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 bg-black/20 backdrop-blur-lg border-purple-500/20">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src={profile?.picture} />
              <AvatarFallback className="bg-purple-600 text-white text-2xl">
                <User />
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-white">
              {profile?.display_name || profile?.name || 'Anonymous'}
            </CardTitle>
            {profile?.nip05 && (
              <Badge className="bg-green-500/80 text-white">
                <Mail className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {profile?.about && (
              <p className="text-gray-300 text-sm text-center">{profile.about}</p>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Public Key</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(npub, 'Public key')}
                  className="text-white hover:bg-white/10 p-1"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-white text-xs font-mono bg-white/5 p-2 rounded break-all">
                {npub}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2 bg-black/20 backdrop-blur-lg border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white">Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-white/10 rounded w-1/4 mb-2"></div>
                    <div className="h-6 bg-white/5 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Display Name</Label>
                    <p className="text-white mt-1">{profile?.display_name || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Name</Label>
                    <p className="text-white mt-1">{profile?.name || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">NIP-05</Label>
                    <div className="flex items-center mt-1">
                      <p className="text-white mr-2">{profile?.nip05 || 'Not verified'}</p>
                      {profile?.nip05 && (
                        <Badge className="bg-green-500/80 text-white text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-400">Lightning Address</Label>
                    <p className="text-white mt-1">{profile?.lud16 || 'Not set'}</p>
                  </div>
                </div>

                {profile?.website && (
                  <div>
                    <Label className="text-gray-400">Website</Label>
                    <div className="flex items-center mt-1">
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 flex items-center"
                      >
                        <Globe className="w-4 h-4 mr-1" />
                        {profile.website}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                )}

                {profile?.about && (
                  <div>
                    <Label className="text-gray-400">About</Label>
                    <p className="text-white mt-1 leading-relaxed">{profile.about}</p>
                  </div>
                )}

                {!profile && (
                  <div className="text-center py-8">
                    <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No profile data found</p>
                    <p className="text-gray-500 text-sm mt-2">
                      This user hasn't set up their Nostr profile yet
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
