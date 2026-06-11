DROP POLICY IF EXISTS "Anyone can insert posts" ON public.posts;

CREATE POLICY "Public can submit posts"
ON public.posts
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(btrim(email)) BETWEEN 3 AND 255
  AND email LIKE '%_@_%.__%'
  AND length(btrim(topic)) BETWEEN 2 AND 500
  AND status = 'pending'
);