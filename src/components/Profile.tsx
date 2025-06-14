
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Globe, Mail, Copy, ExternalLink, ArrowLeft } from 'lucide-react'
import { getProfileFromPubkey, getProfileFromNip05, formatPubkey, NostrProfile } from '@/lib/nostr'
import { toast } from 'sonner'

interface ProfileProps {
  pubkey: string
  onBack: () => void
}

export function Profile({ pubkey, onBack }: ProfileProps) {
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex items-center gap-4 mb-8">
        <Button onClick={onBack} variant="outline" size="icon" className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-deep-sea leading-tight">Nostr Profile</h1>
          <p className="text-steel-blue text-md sm:text-lg">Your identity on the decentralized web.</p>
        </div>
      </div>

      {/* NIP-05 Lookup Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-deep-sea flex items-center">
            <Mail className="w-5 h-5 mr-2 text-steel-blue" />
            Load Profile from NIP-05
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:space-x-2">
            <div className="flex-1">
              <Label htmlFor="nip05" className="text-steel-blue">NIP-05 Address</Label>
              <Input
                id="nip05"
                placeholder="username@domain.com"
                value={nip05Input}
                onChange={(e) => setNip05Input(e.target.value)}
              />
            </div>
            <Button
              onClick={loadNip05Profile}
              disabled={nip05Loading}
              className="bg-teal hover:bg-teal/90 text-white mt-4 sm:mt-6"
            >
              {nip05Loading ? 'Loading...' : 'Load Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-white shadow-lg">
              <AvatarImage src={profile?.picture} />
              <AvatarFallback className="bg-steel-blue text-white text-2xl">
                <User />
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-deep-sea">
              {profile?.display_name || profile?.name || 'Anonymous'}
            </CardTitle>
            {profile?.nip05 && (
              <Badge className="bg-teal text-white border-0 mt-1">
                <Mail className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {profile?.about && (
              <p className="text-steel-blue text-sm text-center">{profile.about}</p>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-steel-blue text-sm">Public Key</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(npub, 'Public key')}
                  className="text-deep-sea hover:bg-gray-100 p-1"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-deep-sea text-xs font-mono bg-muted p-2 rounded break-all">
                {npub}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-deep-sea">Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-6 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-steel-blue">Display Name</Label>
                    <p className="text-deep-sea mt-1 font-semibold">{profile?.display_name || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-steel-blue">Name</Label>
                    <p className="text-deep-sea mt-1 font-semibold">{profile?.name || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-steel-blue">NIP-05</Label>
                    <div className="flex items-center mt-1">
                      <p className="text-deep-sea mr-2 font-semibold">{profile?.nip05 || 'Not verified'}</p>
                      {profile?.nip05 && (
                        <Badge className="bg-teal text-white text-xs border-0">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-steel-blue">Lightning Address</Label>
                    <p className="text-deep-sea mt-1 font-semibold">{profile?.lud16 || 'Not set'}</p>
                  </div>
                </div>

                {profile?.website && (
                  <div>
                    <Label className="text-steel-blue">Website</Label>
                    <div className="flex items-center mt-1">
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal hover:text-teal/80 flex items-center font-semibold"
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
                    <Label className="text-steel-blue">About</Label>
                    <p className="text-deep-sea mt-1 leading-relaxed">{profile.about}</p>
                  </div>
                )}

                {!profile && !loading && (
                  <div className="text-center py-8">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-steel-blue">No profile data found</p>
                    <p className="text-muted-foreground text-sm mt-2">
                      This user hasn't set up their Nostr profile yet.
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
