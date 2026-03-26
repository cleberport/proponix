
ALTER TABLE public.proposal_links 
  ALTER COLUMN max_views SET DEFAULT 50;

ALTER TABLE public.proposal_links 
  ADD COLUMN IF NOT EXISTS last_viewed_at timestamptz;
