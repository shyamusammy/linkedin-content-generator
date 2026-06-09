
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  topic TEXT NOT NULL,
  audience TEXT,
  tone TEXT,
  post_type TEXT,
  title TEXT,
  linkedin_post TEXT,
  image_prompt TEXT,
  hashtags TEXT[],
  cta TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX posts_email_created_at_idx ON public.posts (email, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO anon, authenticated;
GRANT ALL ON public.posts TO service_role;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert posts" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update posts" ON public.posts FOR UPDATE USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
