
ALTER TABLE public.proposal_links 
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT (now() + interval '5 days'),
ADD COLUMN IF NOT EXISTS negotiation_message text DEFAULT NULL;
