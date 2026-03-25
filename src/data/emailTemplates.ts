import type { EmailTemplateProps } from '@/components/email/EmailTemplate';

export interface EmailTemplateDefinition {
  id: string;
  label: string;
  description: string;
  props: EmailTemplateProps;
}

export const emailTemplates: EmailTemplateDefinition[] = [
  {
    id: 'welcome',
    label: 'Boas-vindas',
    description: 'Enviado ao criar a conta',
    props: {
      title: 'Bem-vindo ao Freelox',
      body: [
        'Seu acesso foi criado com sucesso. Agora você já pode começar a criar e enviar propostas em minutos.',
        'Com o Freelox, você monta orçamentos profissionais direto do celular e envia por WhatsApp — sem complicação.',
      ],
      ctaText: 'Acessar minha conta',
      ctaUrl: 'https://freelox.lovable.app/dashboard',
    },
  },
  {
    id: 'trial-reminder',
    label: 'Lembrete de Trial',
    description: 'Enviado 3 dias antes do trial expirar',
    props: {
      title: 'Seu trial está acabando',
      body: [
        'Restam apenas 3 dias do seu período de teste no Freelox.',
        'Assine agora para continuar usando todos os recursos sem interrupção. Seus templates e documentos estão salvos e prontos para usar.',
      ],
      ctaText: 'Ver planos',
      ctaUrl: 'https://freelox.lovable.app/pricing',
      footerExtra: 'Você está recebendo este email porque se cadastrou no Freelox.',
    },
  },
  {
    id: 'trial-expired',
    label: 'Trial Expirado',
    description: 'Enviado quando o trial expira',
    props: {
      title: 'Seu período de teste terminou',
      body: [
        'Seu trial no Freelox expirou. Mas não se preocupe — todos os seus dados estão salvos.',
        'Assine um plano para reativar sua conta e continuar criando propostas profissionais em minutos.',
      ],
      ctaText: 'Assinar agora',
      ctaUrl: 'https://freelox.lovable.app/pricing',
    },
  },
  {
    id: 'payment-success',
    label: 'Pagamento Confirmado',
    description: 'Enviado após pagamento aprovado',
    props: {
      title: 'Pagamento confirmado!',
      body: [
        'Seu pagamento foi processado com sucesso. Obrigado por assinar o Freelox!',
        'Agora você tem acesso completo a todos os recursos. Continue criando e enviando suas propostas profissionais.',
      ],
      ctaText: 'Ir para o Dashboard',
      ctaUrl: 'https://freelox.lovable.app/dashboard',
      footerExtra: 'Você receberá um recibo detalhado por email separado.',
    },
  },
  {
    id: 'payment-failed',
    label: 'Falha no Pagamento',
    description: 'Enviado quando o pagamento falha',
    props: {
      title: 'Problema com seu pagamento',
      body: [
        'Não conseguimos processar seu último pagamento. Isso pode acontecer por fundos insuficientes ou cartão expirado.',
        'Atualize seus dados de pagamento para evitar a interrupção do serviço.',
      ],
      ctaText: 'Atualizar pagamento',
      ctaUrl: 'https://freelox.lovable.app/settings',
      footerExtra: 'Se o problema persistir, entre em contato com nosso suporte.',
    },
  },
];
