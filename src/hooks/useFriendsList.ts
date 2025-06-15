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
  is_favorite?: boolean;
  friend_source?: string;
}

export interface FriendCircle {
  id: string;
  user_pubkey: string;
  name: string;
  color?: string;
  created_at: string;
  updated_at: string;
  members?: Friend[];
}

export interface CircleMember {
  id: string;
  circle_id: string;
  member_pubkey: string;
  added_by_pubkey: string;
  created_at: string;
}

export function useFriendsList(userPubkey: string) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [circles, setCircles] = useState<FriendCircle[]>([]);
  const [circlesImIn, setCirclesImIn] = useState<FriendCircle[]>([]);
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

  // Load user's circles
  const loadCircles = async () => {
    try {
      const { data: circlesData, error } = await supabase
        .from('friend_circles')
        .select(`
          *,
          friend_circle_members (
            member_pubkey,
            added_by_pubkey
          )
        `)
        .eq('user_pubkey', userPubkey);

      if (error) throw error;

      // Process circles with member details
      const circlesWithMembers = await Promise.all(
        (circlesData || []).map(async (circle) => {
          const memberPubkeys = circle.friend_circle_members.map(m => m.member_pubkey);
          const memberDetails = friends.filter(friend => 
            memberPubkeys.includes(friend.followed_pubkey)
          );

          return {
            ...circle,
            members: memberDetails
          };
        })
      );

      setCircles(circlesWithMembers);
    } catch (error) {
      console.error('Error loading circles:', error);
    }
  };

  // Load circles user is a member of
  const loadCirclesImIn = async () => {
    try {
      const { data: membershipData, error } = await supabase
        .from('friend_circle_members')
        .select(`
          circle_id,
          friend_circles (
            id,
            user_pubkey,
            name,
            color,
            created_at,
            updated_at
          )
        `)
        .eq('member_pubkey', userPubkey);

      if (error) throw error;

      const circlesImInData = (membershipData || [])
        .map(m => m.friend_circles)
        .filter(Boolean);

      setCirclesImIn(circlesImInData);
    } catch (error) {
      console.error('Error loading circles I am in:', error);
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
              followed_website: profile?.website,
              friend_source: 'sync'
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
      await loadCircles();
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
          followed_website: profile?.website,
          friend_source: 'manual',
          is_favorite: true // Auto-favorite manually added friends
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
      await loadCircles();
      toast.success('Friend removed successfully');
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Failed to remove friend');
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (friendId: string) => {
    try {
      const friend = friends.find(f => f.id === friendId);
      if (!friend) return;

      const { error } = await supabase
        .from('follow_npub')
        .update({ is_favorite: !friend.is_favorite })
        .eq('id', friendId)
        .eq('user_pubkey', userPubkey);

      if (error) throw error;

      await loadFriendsFromCache();
      toast.success(friend.is_favorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
    }
  };

  // Create a new circle
  const createCircle = async (name: string, color?: string) => {
    try {
      const { error } = await supabase
        .from('friend_circles')
        .insert({
          user_pubkey: userPubkey,
          name: name.trim(),
          color: color || null
        });

      if (error) throw error;

      await loadCircles();
      toast.success('Circle created successfully');
    } catch (error) {
      console.error('Error creating circle:', error);
      toast.error('Failed to create circle');
    }
  };

  // Add friend to circle
  const addFriendToCircle = async (friendPubkey: string, circleId: string) => {
    try {
      const { error } = await supabase
        .from('friend_circle_members')
        .insert({
          circle_id: circleId,
          member_pubkey: friendPubkey,
          added_by_pubkey: userPubkey
        });

      if (error) throw error;

      await loadCircles();
      toast.success('Friend added to circle');
    } catch (error) {
      console.error('Error adding friend to circle:', error);
      toast.error('Failed to add friend to circle');
    }
  };

  // Remove friend from circle
  const removeFriendFromCircle = async (friendPubkey: string, circleId: string) => {
    try {
      const { error } = await supabase
        .from('friend_circle_members')
        .delete()
        .eq('circle_id', circleId)
        .eq('member_pubkey', friendPubkey);

      if (error) throw error;

      await loadCircles();
      toast.success('Friend removed from circle');
    } catch (error) {
      console.error('Error removing friend from circle:', error);
      toast.error('Failed to remove friend from circle');
    }
  };

  // Delete a circle
  const deleteCircle = async (circleId: string) => {
    try {
      const { error } = await supabase
        .from('friend_circles')
        .delete()
        .eq('id', circleId)
        .eq('user_pubkey', userPubkey);

      if (error) throw error;

      await loadCircles();
      toast.success('Circle deleted successfully');
    } catch (error) {
      console.error('Error deleting circle:', error);
      toast.error('Failed to delete circle');
    }
  };

  // Update a circle's name
  const updateCircle = async (circleId: string, name: string) => {
    try {
      const { error } = await supabase
        .from('friend_circles')
        .update({ 
          name: name.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', circleId)
        .eq('user_pubkey', userPubkey);

      if (error) throw error;

      await loadCircles();
      toast.success('Circle updated successfully');
    } catch (error) {
      console.error('Error updating circle:', error);
      toast.error('Failed to update circle');
    }
  };

  // Get favorites
  const getFavorites = () => {
    return friends.filter(friend => friend.is_favorite);
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

  useEffect(() => {
    if (friends.length > 0) {
      loadCircles();
      loadCirclesImIn();
    }
  }, [friends]);

  return {
    friends,
    circles,
    circlesImIn,
    loading,
    syncing,
    addFriend,
    removeFriend,
    syncFriendsFromNostr,
    toggleFavorite,
    createCircle,
    updateCircle,
    addFriendToCircle,
    removeFriendFromCircle,
    deleteCircle,
    getFavorites
  };
}
