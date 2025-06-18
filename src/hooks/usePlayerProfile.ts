
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PlayerProfile {
  pubkey: string;
  name?: string;
  display_name?: string;
  picture?: string;
  npub?: string;
}

export function usePlayerProfile(pubkey: string | null) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pubkey) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('pubkey, name, display_name, picture, npub')
          .eq('pubkey', pubkey)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          // Create fallback profile
          setProfile({ pubkey });
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfile({ pubkey });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [pubkey]);

  return { profile, loading };
}
