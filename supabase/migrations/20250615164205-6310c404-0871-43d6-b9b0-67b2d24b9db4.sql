
-- Create friend_circles table for user-created circles
CREATE TABLE public.friend_circles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_pubkey TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create friend_circle_members table for circle memberships
CREATE TABLE public.friend_circle_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES public.friend_circles(id) ON DELETE CASCADE,
  member_pubkey TEXT NOT NULL,
  added_by_pubkey TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one membership per circle-member pair
  UNIQUE(circle_id, member_pubkey)
);

-- Add new columns to follow_npub table for favorites and source tracking
ALTER TABLE public.follow_npub 
ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN friend_source TEXT NOT NULL DEFAULT 'sync';

-- Add Row Level Security (RLS) for friend_circles
ALTER TABLE public.friend_circles ENABLE ROW LEVEL SECURITY;

-- Circles policies - users can manage their own circles
CREATE POLICY "Users can view their own circles" 
  ON public.friend_circles 
  FOR SELECT 
  USING (user_pubkey = (SELECT current_setting('request.jwt.claims', true)::json->>'sub')::text OR 
         id IN (SELECT circle_id FROM public.friend_circle_members WHERE member_pubkey = (SELECT current_setting('request.jwt.claims', true)::json->>'sub')::text));

CREATE POLICY "Users can create their own circles" 
  ON public.friend_circles 
  FOR INSERT 
  WITH CHECK (user_pubkey = (SELECT current_setting('request.jwt.claims', true)::json->>'sub')::text);

CREATE POLICY "Users can update their own circles" 
  ON public.friend_circles 
  FOR UPDATE 
  USING (user_pubkey = (SELECT current_setting('request.jwt.claims', true)::json->>'sub')::text);

CREATE POLICY "Users can delete their own circles" 
  ON public.friend_circles 
  FOR DELETE 
  USING (user_pubkey = (SELECT current_setting('request.jwt.claims', true)::json->>'sub')::text);

-- Add Row Level Security (RLS) for friend_circle_members
ALTER TABLE public.friend_circle_members ENABLE ROW LEVEL SECURITY;

-- Circle members policies - users can view memberships they're part of
CREATE POLICY "Users can view circle memberships" 
  ON public.friend_circle_members 
  FOR SELECT 
  USING (added_by_pubkey = (SELECT current_setting('request.jwt.claims', true)::json->>'sub')::text OR 
         member_pubkey = (SELECT current_setting('request.jwt.claims', true)::json->>'sub')::text OR
         circle_id IN (SELECT id FROM public.friend_circles WHERE user_pubkey = (SELECT current_setting('request.jwt.claims', true)::json->>'sub')::text));

CREATE POLICY "Circle owners can add members" 
  ON public.friend_circle_members 
  FOR INSERT 
  WITH CHECK (circle_id IN (SELECT id FROM public.friend_circles WHERE user_pubkey = (SELECT current_setting('request.jwt.claims', true)::json->>'sub')::text));

CREATE POLICY "Circle owners can remove members" 
  ON public.friend_circle_members 
  FOR DELETE 
  USING (circle_id IN (SELECT id FROM public.friend_circles WHERE user_pubkey = (SELECT current_setting('request.jwt.claims', true)::json->>'sub')::text));

-- Create indexes for better performance
CREATE INDEX idx_friend_circles_user_pubkey ON public.friend_circles(user_pubkey);
CREATE INDEX idx_friend_circle_members_circle_id ON public.friend_circle_members(circle_id);
CREATE INDEX idx_friend_circle_members_member_pubkey ON public.friend_circle_members(member_pubkey);
CREATE INDEX idx_follow_npub_is_favorite ON public.follow_npub(user_pubkey, is_favorite) WHERE is_favorite = true;
