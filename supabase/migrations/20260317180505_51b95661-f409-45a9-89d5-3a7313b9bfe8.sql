
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  profile_name text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  company_cnpj text NOT NULL DEFAULT '',
  company_email text NOT NULL DEFAULT '',
  company_phone text NOT NULL DEFAULT '',
  company_website text NOT NULL DEFAULT '',
  company_address text NOT NULL DEFAULT '',
  default_tax_rate numeric NOT NULL DEFAULT 0.10,
  logo_url text NOT NULL DEFAULT '',
  logo_width integer,
  logo_height integer,
  logo_aspect_ratio numeric,
  theme text NOT NULL DEFAULT 'light',
  pdf_base_name text NOT NULL DEFAULT 'Proposta',
  default_template_id text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_user_settings_updated_at()
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

CREATE TRIGGER set_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_settings_updated_at();
