
import { SimplePool } from 'nostr-tools/pool'
import { getPublicKey } from 'nostr-tools/pure'
import * as nip19 from 'nostr-tools/nip19'
import { queryProfile } from 'nostr-tools/nip05'

export const pool = new SimplePool()

export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://nostr.wine'
]

export interface NostrProfile {
  name?: string
  display_name?: string
  about?: string
  picture?: string
  banner?: string
  nip05?: string
  lud16?: string
  website?: string
}

export async function getProfileFromPubkey(pubkey: string): Promise<NostrProfile | null> {
  try {
    const events = await pool.querySync(DEFAULT_RELAYS, {
      kinds: [0],
      authors: [pubkey],
      limit: 1
    })

    if (events.length > 0) {
      const profileData = JSON.parse(events[0].content)
      return profileData
    }
    return null
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

export async function getProfileFromNip05(nip05Address: string): Promise<{ pubkey: string; profile: NostrProfile } | null> {
  try {
    const nip05Profile = await queryProfile(nip05Address)
    if (nip05Profile?.pubkey) {
      const profile = await getProfileFromPubkey(nip05Profile.pubkey)
      return {
        pubkey: nip05Profile.pubkey,
        profile: profile || {}
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching NIP-05 profile:', error)
    return null
  }
}

export function formatPubkey(pubkey: string): string {
  try {
    return nip19.npubEncode(pubkey)
  } catch {
    return pubkey
  }
}
