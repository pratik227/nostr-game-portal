
-- DROP all RLS policies on friend_circles
DROP POLICY IF EXISTS "Users can view their own circles" ON public.friend_circles;
DROP POLICY IF EXISTS "Users can create their own circles" ON public.friend_circles;
DROP POLICY IF EXISTS "Users can update their own circles" ON public.friend_circles;
DROP POLICY IF EXISTS "Users can delete their own circles" ON public.friend_circles;

-- Disable RLS enforcement on friend_circles
ALTER TABLE public.friend_circles DISABLE ROW LEVEL SECURITY;

-- DROP all RLS policies on friend_circle_members
DROP POLICY IF EXISTS "Users can view circle memberships" ON public.friend_circle_members;
DROP POLICY IF EXISTS "Circle owners can add members" ON public.friend_circle_members;
DROP POLICY IF EXISTS "Circle owners can remove members" ON public.friend_circle_members;

-- Disable RLS enforcement on friend_circle_members
ALTER TABLE public.friend_circle_members DISABLE ROW LEVEL SECURITY;
