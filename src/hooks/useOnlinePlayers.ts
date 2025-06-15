
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OnlinePlayer {
  id: string;
  pubkey: string;
  npub?: string;
  name?: string;
  display_name?: string;
  picture?: string;
  about?: string;
  nip05?: string;
  lud16?: string;
  website?: string;
  banner?: string;
  last_seen_at: string;
  status: 'online' | 'recent';
}

export function useOnlinePlayers(userPubkey: string) {
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOnlinePlayers = useCallback(async () => {
    if (!userPubkey) return;

    try {
      // 1. Get the list of pubkeys that the user is following (their "friends"/follows)
      const { data: follows, error: followErr } = await supabase
        .from('follow_npub')
        .select('followed_pubkey')
        .eq('user_pubkey', userPubkey);

      if (followErr || !follows) {
        setOnlinePlayers([]);
        return;
      }

      const followedPubkeys = follows.map(f => f.followed_pubkey);

      if (followedPubkeys.length === 0) {
        setOnlinePlayers([]);
        return;
      }

      // 2. Query the users table ONLY for these followed pubkeys (friends)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: onlineUsersData } = await supabase
        .from('users')
        .select('id, pubkey, npub, name, display_name, picture, last_seen_at, about, nip05, lud16, website, banner')
        .not('last_seen_at', 'is', null)
        .gte('last_seen_at', twentyFourHoursAgo)
        .in('pubkey', followedPubkeys)
        .order('last_seen_at', { ascending: false })
        .limit(50);

      if (!onlineUsersData) {
        setOnlinePlayers([]);
        return;
      }

      const now = Date.now();
      const fifteenMinutesAgo = now - 15 * 60 * 1000;

      const players: OnlinePlayer[] = onlineUsersData
        .filter(user => user.pubkey !== userPubkey) // Don't include current user
        .map(user => {
          const lastSeenTime = new Date(user.last_seen_at!).getTime();
          return {
            id: user.id,
            pubkey: user.pubkey,
            npub: user.npub || undefined,
            name: user.name || undefined,
            display_name: user.display_name || undefined,
            picture: user.picture || undefined,
            about: user.about || undefined,
            nip05: user.nip05 || undefined,
            lud16: user.lud16 || undefined,
            website: user.website || undefined,
            banner: user.banner || undefined,
            last_seen_at: user.last_seen_at!,
            status: (lastSeenTime > fifteenMinutesAgo ? 'online' : 'recent') as 'online' | 'recent'
          };
        })
        .sort((a, b) => new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime());

      setOnlinePlayers(players);
    } catch (error) {
      console.error('Error loading online players:', error);
      setOnlinePlayers([]);
    } finally {
      setLoading(false);
    }
  }, [userPubkey]);

  const refreshOnlinePlayers = useCallback(() => {
    loadOnlinePlayers();
  }, [loadOnlinePlayers]);

  useEffect(() => {
    loadOnlinePlayers();

    const interval = setInterval(loadOnlinePlayers, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadOnlinePlayers]);

  return {
    onlinePlayers,
    loading,
    refreshOnlinePlayers
  };
}
