import { useState, useEffect, useCallback } from 'react';
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
  const [operationLoading, setOperationLoading] = useState(false);

  // Load friends from Supabase cache - stable function
  const loadFriendsFromCache = useCallback(async () => {
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
      return data || [];
    } catch (error) {
      console.error('Error loading friends from cache:', error);
      toast.error('Failed to load friends list');
      return [];
    }
  }, [userPubkey]);

  // Load user's circles - stable function with friends parameter
  const loadCircles = useCallback(async (friendsData?: Friend[]) => {
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

      // Use provided friends data or current state
      const currentFriends = friendsData || friends;

      // Process circles with member details
      const circlesWithMembers = await Promise.all(
        (circlesData || []).map(async (circle) => {
          const memberPubkeys = circle.friend_circle_members.map(m => m.member_pubkey);
          const memberDetails = currentFriends.filter(friend => 
            memberPubkeys.includes(friend.followed_pubkey)
          );

          return {
            ...circle,
            members: memberDetails
          };
        })
      );

      setCircles(circlesWithMembers);
      return circlesWithMembers;
    } catch (error) {
      console.error('Error loading circles:', error);
      return [];
    }
  }, [userPubkey]); // Removed friends dependency

  // Load circles user is a member of - stable function
  const loadCirclesImIn = useCallback(async () => {
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
      return circlesImInData;
    } catch (error) {
      console.error('Error loading circles I am in:', error);
      return [];
    }
  }, [userPubkey]);

  // Controlled refresh functions - only call when needed
  const refreshFriends = useCallback(async () => {
    const updatedFriends = await loadFriendsFromCache();
    await loadCircles(updatedFriends);
    return updatedFriends;
  }, [loadFriendsFromCache, loadCircles]);

  const refreshCircles = useCallback(async () => {
    const updatedCircles = await loadCircles();
    return updatedCircles;
  }, [loadCircles]);

  const refreshAll = useCallback(async () => {
    const updatedFriends = await loadFriendsFromCache();
    const updatedCircles = await loadCircles(updatedFriends);
    await loadCirclesImIn();
    return { friends: updatedFriends, circles: updatedCircles };
  }, [loadFriendsFromCache, loadCircles, loadCirclesImIn]);

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

      // Explicit refresh only after sync
      await refreshAll();
      toast.success('Friends list synced from Nostr');
    } catch (error) {
      console.error('Error syncing from Nostr:', error);
      toast.error('Failed to sync friends from Nostr');
    } finally {
      setSyncing(false);
    }
  };

  // Add a friend with controlled refresh
  const addFriend = async (pubkeyOrNpub: string) => {
    console.log('Adding friend:', pubkeyOrNpub);
    if (operationLoading) return; // Prevent duplicate operations
    
    setOperationLoading(true);
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
          toast.error('Invalid npub format');
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
        toast.error('Friend already added');
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
        toast.error('Failed to add friend');
        return;
      }

      // Controlled refresh only after successful add
      await refreshFriends();
      toast.success('Friend added successfully');
    } catch (error) {
      console.error('Error adding friend:', error);
      toast.error('Failed to add friend');
    } finally {
      setOperationLoading(false);
    }
  };

  // Remove a friend with controlled refresh
  const removeFriend = async (friendId: string) => {
    console.log('Removing friend:', friendId);
    if (operationLoading) return;
    
    setOperationLoading(true);
    try {
      const { error } = await supabase
        .from('follow_npub')
        .delete()
        .eq('id', friendId)
        .eq('user_pubkey', userPubkey);

      if (error) throw error;

      // Update Nostr (publish new kind:3 event)
      await publishFollowList();
      
      // Controlled refresh only after successful removal
      await refreshAll();
      toast.success('Friend removed successfully');
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Failed to remove friend');
    } finally {
      setOperationLoading(false);
    }
  };

  // Toggle favorite status with optimistic update
  const toggleFavorite = async (friendId: string) => {
    if (operationLoading) return;
    
    setOperationLoading(true);
    
    // Find the friend
    const friend = friends.find(f => f.id === friendId);
    if (!friend) {
      setOperationLoading(false);
      return;
    }

    // Optimistic update
    const newFavoriteStatus = !friend.is_favorite;
    setFriends(prev => prev.map(f => 
      f.id === friendId ? { ...f, is_favorite: newFavoriteStatus } : f
    ));

    try {
      const { error } = await supabase
        .from('follow_npub')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', friendId)
        .eq('user_pubkey', userPubkey);

      if (error) {
        // Revert optimistic update on error
        setFriends(prev => prev.map(f => 
          f.id === friendId ? { ...f, is_favorite: friend.is_favorite } : f
        ));
        throw error;
      }

      toast.success(newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
    } finally {
      setOperationLoading(false);
    }
  };

  // Create a new circle with controlled refresh
  const createCircle = async (name: string, color?: string) => {
    if (operationLoading) return;
    
    setOperationLoading(true);
    try {
      const { error } = await supabase
        .from('friend_circles')
        .insert({
          user_pubkey: userPubkey,
          name: name.trim(),
          color: color || null
        });

      if (error) throw error;

      await refreshCircles();
      toast.success('Circle created successfully');
    } catch (error) {
      console.error('Error creating circle:', error);
      toast.error('Failed to create circle');
    } finally {
      setOperationLoading(false);
    }
  };

  // Add friend to circle with controlled refresh and duplicate check
  const addFriendToCircle = async (friendPubkey: string, circleId: string) => {
    if (operationLoading) return;

    setOperationLoading(true);
    try {
      // Check if this friend is already a member of the circle
      const { data: existing, error: checkError } = await supabase
        .from('friend_circle_members')
        .select('id')
        .eq('circle_id', circleId)
        .eq('member_pubkey', friendPubkey)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        // User is already in this circle
        toast.error('User is already a member of this circle');
        return { status: 'duplicate' };
      }

      const { error } = await supabase
        .from('friend_circle_members')
        .insert({
          circle_id: circleId,
          member_pubkey: friendPubkey,
          added_by_pubkey: userPubkey
        });

      if (error) throw error;

      await refreshCircles();
      toast.success('Friend added to circle');
      return { status: 'added' };
    } catch (error: any) {
      console.error('Error adding friend to circle:', error);
      toast.error(error?.message || 'Failed to add friend to circle');
      return { status: 'error', error };
    } finally {
      setOperationLoading(false);
    }
  };

  // Remove friend from circle with controlled refresh
  const removeFriendFromCircle = async (friendPubkey: string, circleId: string) => {
    if (operationLoading) return;
    
    setOperationLoading(true);
    try {
      const { error } = await supabase
        .from('friend_circle_members')
        .delete()
        .eq('circle_id', circleId)
        .eq('member_pubkey', friendPubkey);

      if (error) throw error;

      await refreshCircles();
      toast.success('Friend removed from circle');
    } catch (error) {
      console.error('Error removing friend from circle:', error);
      toast.error('Failed to remove friend from circle');
    } finally {
      setOperationLoading(false);
    }
  };

  // Delete a circle with controlled refresh
  const deleteCircle = async (circleId: string) => {
    if (operationLoading) return;
    
    setOperationLoading(true);
    try {
      const { error } = await supabase
        .from('friend_circles')
        .delete()
        .eq('id', circleId)
        .eq('user_pubkey', userPubkey);

      if (error) throw error;

      await refreshCircles();
      toast.success('Circle deleted successfully');
    } catch (error) {
      console.error('Error deleting circle:', error);
      toast.error('Failed to delete circle');
    } finally {
      setOperationLoading(false);
    }
  };

  // Update a circle's name and color with controlled refresh
  const updateCircle = async (circleId: string, name: string, color?: string) => {
    if (operationLoading) return;
    
    setOperationLoading(true);
    try {
      const updateData: any = { 
        name: name.trim(),
        updated_at: new Date().toISOString()
      };

      if (color) {
        updateData.color = color;
      }

      const { error } = await supabase
        .from('friend_circles')
        .update(updateData)
        .eq('id', circleId)
        .eq('user_pubkey', userPubkey);

      if (error) throw error;

      await refreshCircles();
      toast.success('Circle updated successfully');
    } catch (error) {
      console.error('Error updating circle:', error);
      toast.error('Failed to update circle');
    } finally {
      setOperationLoading(false);
    }
  };

  // Get favorites - memoized computation
  const getFavorites = useCallback(() => {
    return friends.filter(friend => friend.is_favorite);
  }, [friends]);

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

  // Initial load only - no automatic refresh
  useEffect(() => {
    if (userPubkey) {
      console.log('Initial load for userPubkey:', userPubkey);
      const initializeData = async () => {
        setLoading(true);
        try {
          const friendsData = await loadFriendsFromCache();
          await loadCircles(friendsData);
          await loadCirclesImIn();
        } finally {
          setLoading(false);
        }
      };
      initializeData();
    }
  }, [userPubkey]); // Only userPubkey dependency - no refresh functions

  return {
    friends,
    circles,
    circlesImIn,
    loading,
    syncing,
    operationLoading,
    addFriend,
    removeFriend,
    syncFriendsFromNostr,
    toggleFavorite,
    createCircle,
    updateCircle,
    addFriendToCircle,
    removeFriendFromCircle,
    deleteCircle,
    getFavorites,
    refreshFriends,
    refreshCircles,
    refreshAll
  };
}
