
CREATE TABLE public.proposal_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_id uuid NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'enviado',
  viewed_at timestamp with time zone,
  approved_at timestamp with time zone,
  approver_name text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_links ENABLE ROW LEVEL SECURITY;

-- Owner can do everything
CREATE POLICY "Users can manage own proposal links"
  ON public.proposal_links FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public read by token (for the client viewing)
CREATE POLICY "Anyone can view by token"
  ON public.proposal_links FOR SELECT TO anon
  USING (true);

-- Public update for status changes (view/approve)
CREATE POLICY "Anyone can update status by token"
  ON public.proposal_links FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- Also allow anon to read the linked document
CREATE POLICY "Anon can read documents via proposal links"
  ON public.generated_documents FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.proposal_links pl
      WHERE pl.document_id = generated_documents.id
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_proposal_links_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER set_proposal_links_updated_at
  BEFORE UPDATE ON public.proposal_links
  FOR EACH ROW EXECUTE FUNCTION public.set_proposal_links_updated_at();
