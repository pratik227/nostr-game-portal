
-- Add a column to store the last seen timestamp for each user
ALTER TABLE public.users ADD COLUMN last_seen_at TIMESTAMPTZ;

-- Add an index to quickly find online users
CREATE INDEX IF NOT EXISTS users_last_seen_at_idx ON public.users (last_seen_at DESC NULLS LAST);

-- Create a function to update a user's last_seen_at timestamp.
-- This will also create a user entry if it doesn't exist.
CREATE OR REPLACE FUNCTION public.update_last_seen(p_pubkey TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.users (pubkey, last_seen_at)
  VALUES (p_pubkey, NOW())
  ON CONFLICT (pubkey) 
  DO UPDATE SET last_seen_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
