
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OnlinePlayer {
  id: string;
  pubkey: string;
  npub?: string;
  name?: string;
  display_name?: string;
  picture?: string;
  last_seen_at: string;
  is_friend: boolean;
  status: 'online' | 'recent';
}

export function useOnlinePlayers(userPubkey: string) {
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOnlinePlayers = useCallback(async () => {
    if (!userPubkey) return;

    try {
      // Get user's friends first
      const { data: friendsData } = await supabase
        .from('follow_npub')
        .select('followed_pubkey')
        .eq('user_pubkey', userPubkey);

      const friendPubkeys = friendsData?.map(f => f.followed_pubkey) || [];

      // Get all users who were active in the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: onlineUsersData } = await supabase
        .from('users')
        .select('id, pubkey, npub, name, display_name, picture, last_seen_at')
        .not('last_seen_at', 'is', null)
        .gte('last_seen_at', twentyFourHoursAgo)
        .order('last_seen_at', { ascending: false })
        .limit(20); // Get more than we need to ensure we have enough after filtering

      if (!onlineUsersData) return;

      const now = Date.now();
      const fifteenMinutesAgo = now - 15 * 60 * 1000;

      // Process users and determine their status
      const players: OnlinePlayer[] = onlineUsersData
        .filter(user => user.pubkey !== userPubkey) // Don't include current user
        .map(user => {
          const lastSeenTime = new Date(user.last_seen_at!).getTime();
          const isFriend = friendPubkeys.includes(user.pubkey);
          
          return {
            id: user.id,
            pubkey: user.pubkey,
            npub: user.npub || undefined,
            name: user.name || undefined,
            display_name: user.display_name || undefined,
            picture: user.picture || undefined,
            last_seen_at: user.last_seen_at!,
            is_friend: isFriend,
            status: lastSeenTime > fifteenMinutesAgo ? 'online' : 'recent'
          };
        })
        // Sort by: friends first, then by recency
        .sort((a, b) => {
          if (a.is_friend && !b.is_friend) return -1;
          if (!a.is_friend && b.is_friend) return 1;
          return new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime();
        })
        .slice(0, 8); // Limit to 8 players

      setOnlinePlayers(players);
    } catch (error) {
      console.error('Error loading online players:', error);
    } finally {
      setLoading(false);
    }
  }, [userPubkey]);

  const refreshOnlinePlayers = useCallback(() => {
    loadOnlinePlayers();
  }, [loadOnlinePlayers]);

  useEffect(() => {
    loadOnlinePlayers();
    
    // Refresh every 2 minutes
    const interval = setInterval(loadOnlinePlayers, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [loadOnlinePlayers]);

  return {
    onlinePlayers,
    loading,
    refreshOnlinePlayers
  };
}
