
import { supabase } from '@/integrations/supabase/client';
import { getProfileFromPubkey } from '@/lib/nostr';

export interface ProfileData {
  name?: string;
  display_name?: string;
  picture?: string;
  npub?: string;
  about?: string;
  banner?: string;
  nip05?: string;
  lud16?: string;
  website?: string;
}

// Update last seen with profile data
export const updateLastSeenWithProfile = async (pubkey: string, profileData?: ProfileData) => {
  try {
    console.log('Updating last seen with profile data for:', pubkey);
    
    const { error } = await supabase.rpc('update_last_seen', {
      p_pubkey: pubkey,
      p_name: profileData?.name || null,
      p_display_name: profileData?.display_name || null,
      p_picture: profileData?.picture || null,
      p_npub: profileData?.npub || null,
      p_about: profileData?.about || null,
      p_banner: profileData?.banner || null,
      p_nip05: profileData?.nip05 || null,
      p_lud16: profileData?.lud16 || null,
      p_website: profileData?.website || null,
    });

    if (error) {
      console.error('Error updating last seen with profile:', error);
    } else {
      console.log('Successfully updated last seen with profile data');
    }
  } catch (error) {
    console.error('Failed to update last seen with profile:', error);
  }
};

// Sync profile data for a user (fetch from Nostr if needed)
export const syncUserProfile = async (pubkey: string) => {
  try {
    console.log('Syncing profile for pubkey:', pubkey);
    
    // First check if we already have profile data
    const { data: existingUser } = await supabase
      .from('users')
      .select('name, display_name, picture, npub, about, banner, nip05, lud16, website')
      .eq('pubkey', pubkey)
      .single();

    // If we have minimal or no profile data, fetch from Nostr
    const needsSync = !existingUser || (!existingUser.name && !existingUser.display_name && !existingUser.picture);
    
    if (needsSync) {
      console.log('Fetching profile from Nostr for:', pubkey);
      const nostrProfile = await getProfileFromPubkey(pubkey);
      
      if (nostrProfile) {
        await updateLastSeenWithProfile(pubkey, nostrProfile);
        console.log('Profile synced successfully for:', pubkey);
      }
    } else {
      // Just update the last seen timestamp
      await updateLastSeenWithProfile(pubkey);
      console.log('Updated last seen timestamp for:', pubkey);
    }
  } catch (error) {
    console.error('Error syncing user profile:', error);
  }
};
