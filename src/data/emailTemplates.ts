import type { EmailTemplateProps } from '@/components/email/EmailTemplate';

export interface EmailTemplateDefinition {
  id: string;
  label: string;
  description: string;
  props: EmailTemplateProps;
}

export const emailTemplates: EmailTemplateDefinition[] = [
  {
    id: 'confirm-email',
    label: 'Confirmação de Email',
    description: 'Enviado ao criar a conta para confirmar o email',
    props: {
      greeting: 'Olá, {{user_name}} 👋',
      title: 'Confirme seu email para começar a usar o Freelox.',
      body: [
        'Clique no botão abaixo para verificar seu endereço de email e ativar sua conta.',
      ],
      ctaText: 'Confirmar email',
      ctaUrl: 'https://freelox.lovable.app/auth/confirm',
      footerText: 'Se você não criou essa conta, ignore este email.',
    },
  },
  {
    id: 'welcome',
    label: 'Boas-vindas',
    description: 'Enviado após confirmação do email',
    props: {
      greeting: 'Olá, {{user_name}} 👋',
      title: 'Bem-vindo ao Freelox!',
      body: [
        'Seu acesso foi ativado com sucesso. Agora você já pode criar e enviar propostas profissionais em minutos.',
        'Monte seus orçamentos direto do celular e envie por WhatsApp — sem complicação.',
      ],
      ctaText: 'Acessar minha conta',
      ctaUrl: 'https://freelox.lovable.app/dashboard',
      footerText: 'Você está recebendo este email porque criou uma conta no Freelox.',
    },
  },
  {
    id: 'trial-reminder',
    label: 'Lembrete de Trial',
    description: 'Enviado 3 dias antes do trial expirar',
    props: {
      greeting: 'Olá, {{user_name}} 👋',
      title: 'Seu trial está acabando.',
      body: [
        'Restam apenas 3 dias do seu período de teste no Freelox.',
        'Assine agora para continuar usando todos os recursos sem interrupção. Seus templates e documentos estão salvos.',
      ],
      ctaText: 'Ver planos',
      ctaUrl: 'https://freelox.lovable.app/pricing',
      footerText: 'Você está recebendo este email porque se cadastrou no Freelox.',
    },
  },
  {
    id: 'trial-expired',
    label: 'Trial Expirado',
    description: 'Enviado quando o trial expira',
    props: {
      greeting: 'Olá, {{user_name}} 👋',
      title: 'Seu período de teste terminou.',
      body: [
        'Seu trial no Freelox expirou, mas não se preocupe — todos os seus dados estão salvos.',
        'Assine um plano para reativar sua conta e continuar criando propostas profissionais.',
      ],
      ctaText: 'Assinar agora',
      ctaUrl: 'https://freelox.lovable.app/pricing',
      footerText: 'Se você não criou essa conta, ignore este email.',
    },
  },
  {
    id: 'payment-success',
    label: 'Pagamento Confirmado',
    description: 'Enviado após pagamento aprovado',
    props: {
      greeting: 'Olá, {{user_name}} 👋',
      title: 'Pagamento confirmado!',
      body: [
        'Seu pagamento foi processado com sucesso. Obrigado por assinar o Freelox!',
        'Agora você tem acesso completo a todos os recursos.',
      ],
      ctaText: 'Ir para o Dashboard',
      ctaUrl: 'https://freelox.lovable.app/dashboard',
      footerText: 'Você receberá um recibo detalhado por email separado.',
    },
  },
  {
    id: 'payment-failed',
    label: 'Falha no Pagamento',
    description: 'Enviado quando o pagamento falha',
    props: {
      greeting: 'Olá, {{user_name}} 👋',
      title: 'Problema com seu pagamento.',
      body: [
        'Não conseguimos processar seu último pagamento. Isso pode acontecer por fundos insuficientes ou cartão expirado.',
        'Atualize seus dados de pagamento para evitar a interrupção do serviço.',
      ],
      ctaText: 'Atualizar pagamento',
      ctaUrl: 'https://freelox.lovable.app/settings',
      footerText: 'Se o problema persistir, entre em contato com nosso suporte.',
    },
  },
];
