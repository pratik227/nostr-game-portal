import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { pool, DEFAULT_RELAYS, getProfileFromPubkey, formatPubkey, type NostrProfile } from '@/lib/nostr';
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
    console.log('Loading friends from cache for pubkey:', userPubkey);
    try {
      const { data, error } = await supabase
        .from('follow_npub')
        .select('*')
        .eq('user_pubkey', userPubkey);

      if (error) {
        console.error('Supabase error loading friends:', error);
        throw error;
      }

      console.log('Loaded friends from cache:', data);
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
    console.log('Syncing friends from Nostr for pubkey:', userPubkey);
    setSyncing(true);
    try {
      // Fetch the latest kind:3 event from the user
      const events = await pool.querySync(DEFAULT_RELAYS, {
        kinds: [3],
        authors: [userPubkey],
        limit: 1
      });

      if (events.length === 0) {
        console.log('No kind:3 events found for user');
        setSyncing(false);
        return;
      }

      const followEvent = events[0];
      const followedPubkeys = followEvent.tags
        .filter(tag => tag[0] === 'p')
        .map(tag => tag[1]);

      console.log('Found followed pubkeys from Nostr:', followedPubkeys);

      // Clear existing follows and add new ones
      await supabase
        .from('follow_npub')
        .delete()
        .eq('user_pubkey', userPubkey);

      // Fetch profiles for each followed pubkey and insert to cache
      for (const pubkey of followedPubkeys) {
        try {
          console.log('Fetching profile for pubkey:', pubkey);
          const profile = await getProfileFromPubkey(pubkey);
          const npub = formatPubkey(pubkey);

          const { error: insertError } = await supabase
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

          if (insertError) {
            console.error('Error inserting friend:', insertError);
          }
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

  // Add a friend (no auth required, RLS disabled)
  const addFriend = async (pubkeyOrNpub: string) => {
    console.log('Adding friend:', pubkeyOrNpub);
    try {
      let pubkey = pubkeyOrNpub;
      if (pubkeyOrNpub.startsWith('npub')) {
        try {
          const decoded = nip19.decode(pubkeyOrNpub);
          if (decoded.type === 'npub') {
            pubkey = decoded.data;
            console.log('Converted npub to pubkey:', pubkey);
          }
        } catch (error) {
          console.error('Invalid npub format:', error);
          return;
        }
      }

      // Check if friend already exists for this user_pubkey
      const { data: existingFriend } = await supabase
        .from('follow_npub')
        .select('id')
        .eq('user_pubkey', userPubkey)
        .eq('followed_pubkey', pubkey)
        .maybeSingle();

      if (existingFriend) {
        console.error('Friend already added');
        return;
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

      if (error) {
        console.error('Error inserting friend to database:', error);
        return;
      }

      // Reload friends
      await loadFriendsFromCache();
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  // Remove a friend
  const removeFriend = async (friendId: string) => {
    console.log('Removing friend:', friendId);
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
        console.log('Nostr extension not available, skipping publish');
        return;
      }

      // Get current friends from cache
      const { data: currentFriends } = await supabase
        .from('follow_npub')
        .select('followed_pubkey')
        .eq('user_pubkey', userPubkey);

      if (!currentFriends) return;

      // Create kind:3 event
      const event = {
        kind: 3,
        created_at: Math.floor(Date.now() / 1000),
        tags: currentFriends.map(friend => ['p', friend.followed_pubkey]),
        content: '',
        pubkey: userPubkey
      };

      // Sign and publish
      const signedEvent = await window.nostr.signEvent(event);
      await pool.publish(DEFAULT_RELAYS, signedEvent);
      console.log('Published follow list to Nostr');
    } catch (error) {
      console.error('Error publishing follow list:', error);
    }
  };

  useEffect(() => {
    if (userPubkey) {
      console.log('useEffect triggered with userPubkey:', userPubkey);
      loadFriendsFromCache();
    }
  }, [userPubkey]);

  return {
    friends,
    loading,
    syncing,
    addFriend,
    removeFriend,
    syncFriendsFromNostr
  };
}
