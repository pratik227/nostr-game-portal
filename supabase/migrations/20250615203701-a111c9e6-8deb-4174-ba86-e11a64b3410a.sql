
-- Update the update_last_seen function to accept and store profile data
CREATE OR REPLACE FUNCTION public.update_last_seen(
  p_pubkey TEXT,
  p_name TEXT DEFAULT NULL,
  p_display_name TEXT DEFAULT NULL,
  p_picture TEXT DEFAULT NULL,
  p_npub TEXT DEFAULT NULL,
  p_about TEXT DEFAULT NULL,
  p_banner TEXT DEFAULT NULL,
  p_nip05 TEXT DEFAULT NULL,
  p_lud16 TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.users (
    pubkey, 
    last_seen_at,
    name,
    display_name,
    picture,
    npub,
    about,
    banner,
    nip05,
    lud16,
    website,
    updated_at
  )
  VALUES (
    p_pubkey, 
    NOW(),
    p_name,
    p_display_name,
    p_picture,
    p_npub,
    p_about,
    p_banner,
    p_nip05,
    p_lud16,
    p_website,
    NOW()
  )
  ON CONFLICT (pubkey) 
  DO UPDATE SET 
    last_seen_at = NOW(),
    name = COALESCE(EXCLUDED.name, users.name),
    display_name = COALESCE(EXCLUDED.display_name, users.display_name),
    picture = COALESCE(EXCLUDED.picture, users.picture),
    npub = COALESCE(EXCLUDED.npub, users.npub),
    about = COALESCE(EXCLUDED.about, users.about),
    banner = COALESCE(EXCLUDED.banner, users.banner),
    nip05 = COALESCE(EXCLUDED.nip05, users.nip05),
    lud16 = COALESCE(EXCLUDED.lud16, users.lud16),
    website = COALESCE(EXCLUDED.website, users.website),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
