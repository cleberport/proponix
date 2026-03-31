
-- Email automations table for admin-defined rules
CREATE TABLE public.email_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  trigger_event text NOT NULL,
  condition_type text NOT NULL DEFAULT 'none',
  condition_value text NOT NULL DEFAULT '',
  delay_minutes integer NOT NULL DEFAULT 0,
  template_id text NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email automations"
  ON public.email_automations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_email_automations_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER set_email_automations_updated_at
  BEFORE UPDATE ON public.email_automations
  FOR EACH ROW EXECUTE FUNCTION public.set_email_automations_updated_at();

-- Seed default automations
INSERT INTO public.email_automations (name, description, trigger_event, condition_type, condition_value, delay_minutes, template_id, enabled) VALUES
('Boas-vindas ao cadastro', 'Envia email de boas-vindas após confirmação do cadastro', 'user_signup', 'none', '', 0, 'welcome', true),
('Proposta visualizada', 'Notifica o remetente quando uma proposta é visualizada', 'proposal_viewed', 'none', '', 0, 'confirm-email', false),
('Proposta aprovada', 'Notifica o remetente quando uma proposta é aprovada', 'proposal_approved', 'none', '', 0, 'payment-success', false),
('Lembrete de trial', 'Envia lembrete 3 dias antes do trial expirar', 'trial_expiring', 'days_before_expiry', '3', 0, 'trial-reminder', true),
('Trial expirado', 'Notifica quando o trial expira', 'trial_expired', 'none', '', 0, 'trial-expired', true);
