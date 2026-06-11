-- Lock down posts table: remove broad public SELECT/UPDATE.
-- Reads and updates will go through server functions using the service role.
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can update posts" ON public.posts;

-- Keep INSERT open so the public generate form can submit a job.
-- (Existing "Anyone can insert posts" policy remains.)

-- Revoke broad table privileges from anon; keep INSERT for the public form.
REVOKE ALL ON public.posts FROM anon;
GRANT INSERT ON public.posts TO anon;

-- Authenticated role keeps no direct access; server functions use service_role.
REVOKE ALL ON public.posts FROM authenticated;
GRANT INSERT ON public.posts TO authenticated;

GRANT ALL ON public.posts TO service_role;