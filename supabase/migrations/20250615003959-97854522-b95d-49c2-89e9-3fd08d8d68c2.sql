
-- Drop the RLS policies from the follow_npub table

DROP POLICY IF EXISTS "Users can view their own follows" ON public.follow_npub;
DROP POLICY IF EXISTS "Users can create their own follows" ON public.follow_npub;
DROP POLICY IF EXISTS "Users can update their own follows" ON public.follow_npub;
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follow_npub;

-- Optionally, disable row level security entirely for broad access
ALTER TABLE public.follow_npub DISABLE ROW LEVEL SECURITY;
