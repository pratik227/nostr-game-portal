
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { pool, DEFAULT_RELAYS, getProfileFromPubkey, formatPubkey, type NostrProfile } from '@/lib/nostr';
import { Event, getEventHash, getSignature, nip04 } from 'nostr-tools';
import * as nip19 from 'nostr-tools/nip19';
import { toast } from 'sonner';

export interface Friend {
  id: string;
  followed_pubkey: string;
  followed_npub: string;
  followed_name?: string;
  followed_display_name?: string;
  followed_about?: string;
  followed_picture?: string;
  followed_banner?: string;
  followed_nip05?: string;
  followed_lud16?: string;
  followed_website?: string;
}

export function useFriendsList(userPubkey: string) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Load friends from Supabase cache
  const loadFriendsFromCache = async () => {
    try {
      const { data, error } = await supabase
        .from('follow_npub')
        .select('*')
        .eq('user_pubkey', userPubkey);

      if (error) throw error;
      setFriends(data || []);
    } catch (error) {
      console.error('Error loading friends from cache:', error);
      toast.error('Failed to load friends list');
    } finally {
      setLoading(false);
    }
  };

  // Sync friends from Nostr (kind:3 events)
  const syncFriendsFromNostr = async () => {
    setSyncing(true);
    try {
      // Fetch the latest kind:3 event from the user
      const events = await pool.querySync(DEFAULT_RELAYS, {
        kinds: [3],
        authors: [userPubkey],
        limit: 1
      });

      if (events.length === 0) {
        setSyncing(false);
        return;
      }

      const followEvent = events[0];
      const followedPubkeys = followEvent.tags
        .filter(tag => tag[0] === 'p')
        .map(tag => tag[1]);

      // Clear existing follows and add new ones
      await supabase
        .from('follow_npub')
        .delete()
        .eq('user_pubkey', userPubkey);

      // Fetch profiles for each followed pubkey and insert to cache
      for (const pubkey of followedPubkeys) {
        try {
          const profile = await getProfileFromPubkey(pubkey);
          const npub = formatPubkey(pubkey);

          await supabase
            .from('follow_npub')
            .insert({
              user_pubkey: userPubkey,
              followed_pubkey: pubkey,
              followed_npub: npub,
              followed_name: profile?.name,
              followed_display_name: profile?.display_name,
              followed_about: profile?.about,
              followed_picture: profile?.picture,
              followed_banner: profile?.banner,
              followed_nip05: profile?.nip05,
              followed_lud16: profile?.lud16,
              followed_website: profile?.website
            });
        } catch (error) {
          console.error('Error fetching profile for', pubkey, error);
        }
      }

      // Reload from cache
      await loadFriendsFromCache();
      toast.success('Friends list synced from Nostr');
    } catch (error) {
      console.error('Error syncing from Nostr:', error);
      toast.error('Failed to sync friends from Nostr');
    } finally {
      setSyncing(false);
    }
  };

  // Add a friend
  const addFriend = async (pubkeyOrNpub: string) => {
    try {
      let pubkey = pubkeyOrNpub;
      
      // Convert npub to pubkey if needed
      if (pubkeyOrNpub.startsWith('npub')) {
        try {
          const decoded = nip19.decode(pubkeyOrNpub);
          if (decoded.type === 'npub') {
            pubkey = decoded.data;
          }
        } catch (error) {
          toast.error('Invalid npub format');
          return;
        }
      }

      // Fetch profile
      const profile = await getProfileFromPubkey(pubkey);
      const npub = formatPubkey(pubkey);

      // Add to cache
      const { error } = await supabase
        .from('follow_npub')
        .insert({
          user_pubkey: userPubkey,
          followed_pubkey: pubkey,
          followed_npub: npub,
          followed_name: profile?.name,
          followed_display_name: profile?.display_name,
          followed_about: profile?.about,
          followed_picture: profile?.picture,
          followed_banner: profile?.banner,
          followed_nip05: profile?.nip05,
          followed_lud16: profile?.lud16,
          followed_website: profile?.website
        });

      if (error) throw error;

      // Update Nostr (publish new kind:3 event)
      await publishFollowList();
      
      // Reload friends
      await loadFriendsFromCache();
      toast.success('Friend added successfully');
    } catch (error) {
      console.error('Error adding friend:', error);
      toast.error('Failed to add friend');
    }
  };

  // Remove a friend
  const removeFriend = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from('follow_npub')
        .delete()
        .eq('id', friendId)
        .eq('user_pubkey', userPubkey);

      if (error) throw error;

      // Update Nostr (publish new kind:3 event)
      await publishFollowList();
      
      // Reload friends
      await loadFriendsFromCache();
      toast.success('Friend removed successfully');
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Failed to remove friend');
    }
  };

  // Publish updated follow list to Nostr
  const publishFollowList = async () => {
    try {
      if (!window.nostr) {
        toast.error('Nostr extension not available');
        return;
      }

      // Get current friends from cache
      const { data: currentFriends } = await supabase
        .from('follow_npub')
        .select('followed_pubkey')
        .eq('user_pubkey', userPubkey);

      if (!currentFriends) return;

      // Create kind:3 event
      const event: Partial<Event> = {
        kind: 3,
        created_at: Math.floor(Date.now() / 1000),
        tags: currentFriends.map(friend => ['p', friend.followed_pubkey]),
        content: '',
        pubkey: userPubkey
      };

      // Sign and publish
      const signedEvent = await window.nostr.signEvent(event);
      await pool.publish(DEFAULT_RELAYS, signedEvent);
    } catch (error) {
      console.error('Error publishing follow list:', error);
    }
  };

  // Send challenge message (NIP-04 DM)
  const sendChallenge = async (friendPubkey: string, message: string) => {
    try {
      if (!window.nostr) {
        toast.error('Nostr extension not available');
        return;
      }

      // Encrypt message using NIP-04
      const encryptedMessage = await nip04.encrypt(userPubkey, friendPubkey, message);

      // Create kind:4 event (DM)
      const event: Partial<Event> = {
        kind: 4,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['p', friendPubkey]],
        content: encryptedMessage,
        pubkey: userPubkey
      };

      // Sign and publish
      const signedEvent = await window.nostr.signEvent(event);
      await pool.publish(DEFAULT_RELAYS, signedEvent);
      
      toast.success('Challenge sent!');
    } catch (error) {
      console.error('Error sending challenge:', error);
      toast.error('Failed to send challenge');
    }
  };

  useEffect(() => {
    if (userPubkey) {
      loadFriendsFromCache();
    }
  }, [userPubkey]);

  return {
    friends,
    loading,
    syncing,
    addFriend,
    removeFriend,
    syncFriendsFromNostr,
    sendChallenge
  };
}
