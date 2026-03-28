
-- Finance folders
CREATE TABLE public.finance_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Nova Pasta',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own finance folders" ON public.finance_folders
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Finance tables
CREATE TABLE public.finance_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  folder_id uuid NOT NULL REFERENCES public.finance_folders(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Nova Tabela',
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own finance tables" ON public.finance_tables
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.set_finance_folders_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_finance_folders_updated_at
  BEFORE UPDATE ON public.finance_folders
  FOR EACH ROW EXECUTE FUNCTION public.set_finance_folders_updated_at();

CREATE OR REPLACE FUNCTION public.set_finance_tables_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_finance_tables_updated_at
  BEFORE UPDATE ON public.finance_tables
  FOR EACH ROW EXECUTE FUNCTION public.set_finance_tables_updated_at();
