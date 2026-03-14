-- Tabela de templates personalizados por usuário
CREATE TABLE IF NOT EXISTS public.custom_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Custom',
  description TEXT NOT NULL DEFAULT 'Template personalizado',
  thumbnail TEXT NOT NULL DEFAULT '',
  color TEXT,
  elements JSONB NOT NULL DEFAULT '[]'::jsonb,
  variables TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  canvas_width INTEGER NOT NULL DEFAULT 595,
  canvas_height INTEGER NOT NULL DEFAULT 842,
  default_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  input_fields TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  calculated_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  settings JSONB NOT NULL DEFAULT '{"taxRate":0.1,"showTax":true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para consultas por usuário
CREATE INDEX IF NOT EXISTS idx_custom_templates_user_id ON public.custom_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_templates_updated_at ON public.custom_templates(updated_at DESC);

-- Atualização automática de updated_at
CREATE OR REPLACE FUNCTION public.set_custom_templates_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_custom_templates_updated_at ON public.custom_templates;
CREATE TRIGGER trg_custom_templates_updated_at
BEFORE UPDATE ON public.custom_templates
FOR EACH ROW
EXECUTE FUNCTION public.set_custom_templates_updated_at();

-- RLS
ALTER TABLE public.custom_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own templates" ON public.custom_templates;
CREATE POLICY "Users can view their own templates"
ON public.custom_templates
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own templates" ON public.custom_templates;
CREATE POLICY "Users can create their own templates"
ON public.custom_templates
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own templates" ON public.custom_templates;
CREATE POLICY "Users can update their own templates"
ON public.custom_templates
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own templates" ON public.custom_templates;
CREATE POLICY "Users can delete their own templates"
ON public.custom_templates
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);