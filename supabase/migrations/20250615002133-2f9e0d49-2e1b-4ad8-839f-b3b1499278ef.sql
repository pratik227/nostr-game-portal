
-- Create a table to cache friends/follows list from Nostr
CREATE TABLE public.follow_npub (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_pubkey TEXT NOT NULL, -- The user who is following
  followed_pubkey TEXT NOT NULL, -- The pubkey being followed
  followed_npub TEXT, -- The npub format for easy display
  
  -- Full Nostr profile data (matching NostrProfile interface)
  followed_name TEXT, -- Cached name
  followed_display_name TEXT, -- Cached display name
  followed_about TEXT, -- Cached about/bio
  followed_picture TEXT, -- Cached profile picture
  followed_banner TEXT, -- Cached banner image
  followed_nip05 TEXT, -- Cached NIP-05 verification
  followed_lud16 TEXT, -- Cached Lightning address (lud16)
  followed_website TEXT, -- Cached website URL
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one follow relationship per user-followed pair
  UNIQUE(user_pubkey, followed_pubkey)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.follow_npub ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own follows
CREATE POLICY "Users can view their own follows" 
  ON public.follow_npub 
  FOR SELECT 
  USING (user_pubkey = (SELECT pubkey FROM public.users WHERE id = auth.uid()));

-- Create policy that allows users to insert their own follows
CREATE POLICY "Users can create their own follows" 
  ON public.follow_npub 
  FOR INSERT 
  WITH CHECK (user_pubkey = (SELECT pubkey FROM public.users WHERE id = auth.uid()));

-- Create policy that allows users to update their own follows
CREATE POLICY "Users can update their own follows" 
  ON public.follow_npub 
  FOR UPDATE 
  USING (user_pubkey = (SELECT pubkey FROM public.users WHERE id = auth.uid()));

-- Create policy that allows users to delete their own follows
CREATE POLICY "Users can delete their own follows" 
  ON public.follow_npub 
  FOR DELETE 
  USING (user_pubkey = (SELECT pubkey FROM public.users WHERE id = auth.uid()));

-- Create index for better performance
CREATE INDEX idx_follow_npub_user_pubkey ON public.follow_npub(user_pubkey);
CREATE INDEX idx_follow_npub_followed_pubkey ON public.follow_npub(followed_pubkey);
