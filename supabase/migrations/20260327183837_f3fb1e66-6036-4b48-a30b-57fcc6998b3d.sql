
CREATE TABLE public.received_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  proposal_link_id uuid NOT NULL,
  document_id uuid NOT NULL,
  sender_user_id uuid NOT NULL,
  client_name text NOT NULL DEFAULT '',
  template_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'enviado',
  received_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, proposal_link_id)
);

ALTER TABLE public.received_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own received proposals"
  ON public.received_proposals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own received proposals"
  ON public.received_proposals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own received proposals"
  ON public.received_proposals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own received proposals"
  ON public.received_proposals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_received_proposals_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_received_proposals_updated_at
  BEFORE UPDATE ON public.received_proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_received_proposals_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.received_proposals;
