
-- Email templates table for admin-managed templates
CREATE TABLE public.email_templates (
  id text PRIMARY KEY,
  label text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  greeting text NOT NULL DEFAULT '',
  body_paragraphs jsonb NOT NULL DEFAULT '[]'::jsonb,
  cta_text text NOT NULL DEFAULT '',
  cta_url text NOT NULL DEFAULT '',
  footer_text text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can manage email templates
CREATE POLICY "Admins can manage email templates"
  ON public.email_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read email_send_log
CREATE POLICY "Admins can read email send log"
  ON public.email_send_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_email_templates_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER set_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_email_templates_updated_at();

-- Seed default templates
INSERT INTO public.email_templates (id, label, description, subject, greeting, body_paragraphs, cta_text, cta_url, footer_text) VALUES
('confirm-email', 'Confirmação de Email', 'Enviado ao criar a conta para confirmar o email', 'Confirme seu email para começar a usar o Freelox.', 'Olá, {{user_name}} 👋', '["Clique no botão abaixo para verificar seu endereço de email e ativar sua conta."]', 'Confirmar email', 'https://freelox.app/auth/confirm', 'Se você não criou essa conta, ignore este email.'),
('welcome', 'Boas-vindas', 'Enviado após confirmação do email', 'Bem-vindo ao Freelox!', 'Olá, {{user_name}} 👋', '["Seu acesso foi ativado com sucesso. Agora você já pode criar e enviar propostas profissionais em minutos.","Monte seus orçamentos direto do celular e envie por WhatsApp — sem complicação."]', 'Acessar minha conta', 'https://freelox.app/dashboard', 'Você está recebendo este email porque criou uma conta no Freelox.'),
('trial-reminder', 'Lembrete de Trial', 'Enviado 3 dias antes do trial expirar', 'Seu trial está acabando.', 'Olá, {{user_name}} 👋', '["Restam apenas 3 dias do seu período de teste no Freelox.","Assine agora para continuar usando todos os recursos sem interrupção. Seus templates e documentos estão salvos."]', 'Ver planos', 'https://freelox.app/pricing', 'Você está recebendo este email porque se cadastrou no Freelox.'),
('trial-expired', 'Trial Expirado', 'Enviado quando o trial expira', 'Seu período de teste terminou.', 'Olá, {{user_name}} 👋', '["Seu trial no Freelox expirou, mas não se preocupe — todos os seus dados estão salvos.","Assine um plano para reativar sua conta e continuar criando propostas profissionais."]', 'Assinar agora', 'https://freelox.app/pricing', 'Se você não criou essa conta, ignore este email.'),
('payment-success', 'Pagamento Confirmado', 'Enviado após pagamento aprovado', 'Pagamento confirmado!', 'Olá, {{user_name}} 👋', '["Seu pagamento foi processado com sucesso. Obrigado por assinar o Freelox!","Agora você tem acesso completo a todos os recursos."]', 'Ir para o Dashboard', 'https://freelox.app/dashboard', 'Você receberá um recibo detalhado por email separado.'),
('payment-failed', 'Falha no Pagamento', 'Enviado quando o pagamento falha', 'Problema com seu pagamento.', 'Olá, {{user_name}} 👋', '["Não conseguimos processar seu último pagamento. Isso pode acontecer por fundos insuficientes ou cartão expirado.","Atualize seus dados de pagamento para evitar a interrupção do serviço."]', 'Atualizar pagamento', 'https://freelox.app/settings', 'Se o problema persistir, entre em contato com nosso suporte.');
