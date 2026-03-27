
ALTER TABLE public.received_proposals 
  ADD COLUMN IF NOT EXISTS sender_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sender_company text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS total_value text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_action text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_action_at timestamp with time zone;
