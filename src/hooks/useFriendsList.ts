import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { pool, DEFAULT_RELAYS, getProfileFromPubkey, formatPubkey, type NostrProfile } from '@/lib/nostr';
import * as nip19 from 'nostr-tools/nip19';
import { toast } from 'sonner';
import { sessionCache } from '@/lib/sessionCache';

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
  last_seen_at?: string | null;
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

// Helper function to chunk arrays into smaller batches
const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

export function useFriendsList(userPubkey: string) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [circles, setCircles] = useState<FriendCircle[]>([]);
  const [circlesImIn, setCirclesImIn] = useState<FriendCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  
  // Track if data has been loaded this session
  const initialLoadRef = useRef(false);
  const cacheKey = `friends_${userPubkey}`;
  const circlesKey = `circles_${userPubkey}`;

  // Load friends from cache first, then database if needed
  const loadFriendsFromCache = useCallback(async (forceRefresh = false) => {
    console.log('Loading friends - force refresh:', forceRefresh);
    
    // Try session cache first (unless force refresh)
    if (!forceRefresh && sessionCache.has(cacheKey)) {
      const cachedFriends = sessionCache.get<Friend[]>(cacheKey);
      if (cachedFriends) {
        console.log('Using cached friends data:', cachedFriends.length);
        setFriends(cachedFriends);
        return cachedFriends;
      }
    }

    try {
      // Get base friend data from follow_npub
      const { data: followData, error: followError } = await supabase
        .from('follow_npub')
        .select('*')
        .eq('user_pubkey', userPubkey);

      if (followError) throw followError;
      if (!followData) return [];

      const friendPubkeys = followData.map(f => f.followed_pubkey);
      if (friendPubkeys.length === 0) {
        setFriends([]);
        sessionCache.set(cacheKey, []);
        return [];
      }
      
      console.log(`Fetching user data for ${friendPubkeys.length} friends in batches`);
      
      // Split pubkeys into batches to avoid URL length limits
      const BATCH_SIZE = 50; // Safe batch size to avoid URL length issues
      const pubkeyBatches = chunkArray(friendPubkeys, BATCH_SIZE);
      
      // Fetch user data in batches
      const allUsersData: any[] = [];
      
      for (let i = 0; i < pubkeyBatches.length; i++) {
        const batch = pubkeyBatches[i];
        console.log(`Processing batch ${i + 1}/${pubkeyBatches.length} with ${batch.length} pubkeys`);
        
        try {
          const { data: batchUsersData, error: batchError } = await supabase
            .from('users')
            .select('pubkey, last_seen_at')
            .in('pubkey', batch);

          if (batchError) {
            console.error(`Error in batch ${i + 1}:`, batchError);
            // Continue with other batches even if one fails
            continue;
          }

          if (batchUsersData) {
            allUsersData.push(...batchUsersData);
          }
        } catch (batchError) {
          console.error(`Failed to process batch ${i + 1}:`, batchError);
          // Continue with other batches
        }
      }

      console.log(`Successfully fetched user data for ${allUsersData.length} out of ${friendPubkeys.length} friends`);

      // Merge the data
      const mergedFriends = followData.map(friend => {
        const userData = allUsersData.find(u => u.pubkey === friend.followed_pubkey);
        return {
          ...friend,
          last_seen_at: userData?.last_seen_at || null,
        };
      });

      console.log('Loaded friends from database:', mergedFriends.length);
      setFriends(mergedFriends as Friend[]);
      
      // Cache the results for 10 minutes
      sessionCache.set(cacheKey, mergedFriends, 10 * 60 * 1000);
      
      return mergedFriends as Friend[];
    } catch (error) {
      console.error('Error loading friends from database:', error);
      
      // Provide more specific error messaging
      if (error?.message?.includes('413') || error?.message?.includes('414')) {
        toast.error('Friend list too large to load at once. Please try refreshing.');
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        toast.error('Network error loading friends. Please check your connection.');
      } else {
        toast.error('Failed to load friends list. Please try again.');
      }
      
      return [];
    }
  }, [userPubkey, cacheKey]);

  // Load circles with caching
  const loadCircles = useCallback(async (friendsData?: Friend[], forceRefresh = false) => {
    // Try session cache first
    if (!forceRefresh && sessionCache.has(circlesKey)) {
      const cachedCircles = sessionCache.get<FriendCircle[]>(circlesKey);
      if (cachedCircles) {
        console.log('Using cached circles data:', cachedCircles.length);
        setCircles(cachedCircles);
        return cachedCircles;
      }
    }

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

      const currentFriends = friendsData || friends;

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

      console.log('Loaded circles from database:', circlesWithMembers.length);
      setCircles(circlesWithMembers);
      
      // Cache circles for 5 minutes
      sessionCache.set(circlesKey, circlesWithMembers, 5 * 60 * 1000);
      
      return circlesWithMembers;
    } catch (error) {
      console.error('Error loading circles:', error);
      return [];
    }
  }, [userPubkey, circlesKey, friends]);

  // Load circles user is a member of
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

  // Optimized refresh functions
  const refreshFriends = useCallback(async (forceRefresh = false) => {
    const updatedFriends = await loadFriendsFromCache(forceRefresh);
    await loadCircles(updatedFriends, forceRefresh);
    return updatedFriends;
  }, [loadFriendsFromCache, loadCircles]);

  const refreshCircles = useCallback(async (forceRefresh = false) => {
    const updatedCircles = await loadCircles(undefined, forceRefresh);
    return updatedCircles;
  }, [loadCircles]);

  const refreshAll = useCallback(async (forceRefresh = false) => {
    const updatedFriends = await loadFriendsFromCache(forceRefresh);
    const updatedCircles = await loadCircles(updatedFriends, forceRefresh);
    await loadCirclesImIn();
    return { friends: updatedFriends, circles: updatedCircles };
  }, [loadFriendsFromCache, loadCircles, loadCirclesImIn]);

  // Invalidate cache helper
  const invalidateCache = useCallback(() => {
    sessionCache.invalidate(cacheKey);
    sessionCache.invalidate(circlesKey);
  }, [cacheKey, circlesKey]);

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

      // Invalidate cache and force refresh
      invalidateCache();
      await refreshAll(true);
      toast.success('Friends list synced from Nostr');
    } catch (error) {
      console.error('Error syncing from Nostr:', error);
      toast.error('Failed to sync friends from Nostr');
    } finally {
      setSyncing(false);
    }
  };

  // Add a friend with cache invalidation
  const addFriend = async (pubkeyOrNpub: string) => {
    console.log('Adding friend:', pubkeyOrNpub);
    if (operationLoading) return;
    
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

      // Check if friend already exists
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
          is_favorite: true
        });

      if (error) {
        console.error('Error inserting friend to database:', error);
        toast.error('Failed to add friend');
        return;
      }

      // Invalidate cache and refresh
      invalidateCache();
      await refreshFriends(true);
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

      await publishFollowList();
      
      invalidateCache();
      await refreshAll(true);
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

      // Update cache
      invalidateCache();
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

      invalidateCache();
      await refreshCircles(true);
      toast.success('Circle created successfully');
    } catch (error) {
      console.error('Error creating circle:', error);
      toast.error('Failed to create circle');
    } finally {
      setOperationLoading(false);
    }
  };

  // Add friend to circle with controlled refresh and duplicate check
  const addFriendToCircle = async (friendPubkey: string, circleId: string): Promise<void> => {
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
        return;
      }

      const { error } = await supabase
        .from('friend_circle_members')
        .insert({
          circle_id: circleId,
          member_pubkey: friendPubkey,
          added_by_pubkey: userPubkey
        });

      if (error) throw error;

      invalidateCache();
      await refreshCircles(true);
      toast.success('Friend added to circle');
    } catch (error: any) {
      console.error('Error adding friend to circle:', error);
      toast.error(error?.message || 'Failed to add friend to circle');
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

      invalidateCache();
      await refreshCircles(true);
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

      invalidateCache();
      await refreshCircles(true);
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

      invalidateCache();
      await refreshCircles(true);
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

      const { data: currentFriends } = await supabase
        .from('follow_npub')
        .select('followed_pubkey')
        .eq('user_pubkey', userPubkey);

      if (!currentFriends) return;

      const event = {
        kind: 3,
        created_at: Math.floor(Date.now() / 1000),
        tags: currentFriends.map(friend => ['p', friend.followed_pubkey]),
        content: '',
        pubkey: userPubkey
      };

      const signedEvent = await window.nostr.signEvent(event);
      await pool.publish(DEFAULT_RELAYS, signedEvent);
      console.log('Published follow list to Nostr');
    } catch (error) {
      console.error('Error publishing follow list:', error);
    }
  };

  // Background activity updates (less frequent)
  useEffect(() => {
    if (!friends.length) return;

    const friendPubkeys = friends.map(f => f.followed_pubkey);
    if (friendPubkeys.length === 0) return;

    const sub = pool.subscribeMany(
      [...DEFAULT_RELAYS, 'wss://relay.damus.io'],
      [{ kinds: [31337], authors: friendPubkeys }],
      {
        onevent(event) {
          // Background update only
          supabase.rpc('update_last_seen', { p_pubkey: event.pubkey })
            .then(({ error }) => {
              if (error) console.error(`Error updating last_seen for ${event.pubkey}:`, error);
            });
        },
      }
    );

    return () => sub.close();
  }, [friends]);

  // Reduced frequency refresh for status updates
  useEffect(() => {
    if (userPubkey && initialLoadRef.current) {
      const interval = setInterval(() => {
        console.log('Background refresh for activity status...');
        // Only refresh friends data, not full reload
        loadFriendsFromCache(true);
      }, 5 * 60 * 1000); // Every 5 minutes instead of 1

      return () => clearInterval(interval);
    }
  }, [userPubkey, loadFriendsFromCache]);

  // Initial load - only once per session
  useEffect(() => {
    if (userPubkey && !initialLoadRef.current) {
      console.log('Initial load for userPubkey:', userPubkey);
      const initializeData = async () => {
        setLoading(true);
        try {
          const friendsData = await loadFriendsFromCache();
          await loadCircles(friendsData);
          await loadCirclesImIn();
          initialLoadRef.current = true;
        } finally {
          setLoading(false);
        }
      };
      initializeData();
    }
  }, [userPubkey, loadFriendsFromCache, loadCircles, loadCirclesImIn]);

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
    refreshAll,
    invalidateCache
  };
}
