import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Check, CreditCard, Crown, ExternalLink, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { useSubscription, PLAN_CONFIG } from '@/contexts/SubscriptionContext';
import { useEffect } from 'react';

const PRICES = {
  pro_monthly: PLAN_CONFIG.pro.monthly_price_id,
  premium_monthly: PLAN_CONFIG.premium.monthly_price_id,
  premium_yearly: PLAN_CONFIG.premium.yearly_price_id,
};

type SelectedPlan = 'pro_monthly' | 'premium_monthly' | 'premium_yearly';

const PLANS = [
  {
    key: 'free' as const,
    label: 'Free (Trial 30 dias)',
    price: 'R$0',
    period: '',
    features: ['1 template', 'Geração de PDF', 'WhatsApp sharing', 'Marca d\'água nos modelos'],
    current: false,
  },
  {
    key: 'pro_monthly' as SelectedPlan,
    label: 'Pro',
    price: 'R$19,90',
    period: '/mês',
    features: ['Templates ilimitados', 'Sem marca d\'água', 'Geração ilimitada de PDF', 'WhatsApp sharing'],
    badge: undefined as string | undefined,
  },
  {
    key: 'premium_monthly' as SelectedPlan,
    label: 'Premium',
    price: 'R$59,90',
    period: '/mês',
    features: [
      'Tudo do Pro',
      'Compartilhamento por link',
      'Documentos completo',
      'Propostas Recebidas',
      'Financeiro completo',
      'Automações e E-mails',
    ],
    badge: 'Mais popular',
  },
  {
    key: 'premium_yearly' as SelectedPlan,
    label: 'Premium Anual',
    price: 'R$599',
    period: '/ano',
    features: [
      'Tudo do Premium',
      '2 meses grátis',
    ],
    badge: 'Melhor valor',
  },
];

export default function BillingSection() {
  const [searchParams] = useSearchParams();
  const { plan, loading, subscriptionEnd, isYearly, refresh } = useSubscription();
  const [checkingOut, setCheckingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>('premium_monthly');

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Assinatura realizada com sucesso!');
      refresh();
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout cancelado.');
    }
  }, [searchParams, refresh]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    toast.success('Status atualizado');
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const priceId = PRICES[selectedPlan];
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: any) {
      toast.error('Erro ao criar checkout: ' + (err?.message || 'Tente novamente'));
    } finally {
      setCheckingOut(false);
      setUpgradeOpen(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: any) {
      toast.error('Erro ao abrir portal: ' + (err?.message || 'Tente novamente'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const planLabel = plan === 'premium' ? (isYearly ? 'Premium Anual' : 'Premium') : plan === 'pro' ? 'Pro' : 'Free';
  const subEnd = subscriptionEnd ? new Date(subscriptionEnd) : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Plan Status */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Status do Plano</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing} className="h-8 w-8">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            plan === 'premium'
              ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400'
              : plan === 'pro'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground'
          }`}>
            {plan !== 'free' && <Crown className="h-3 w-3" />}
            {plan === 'free' && <Sparkles className="h-3 w-3" />}
            Plano {planLabel}
          </span>
        </div>

        <p className="text-sm text-muted-foreground">
          {plan === 'free' && 'Você está no plano gratuito.'}
          {plan !== 'free' && subEnd && `Próxima renovação em ${subEnd.toLocaleDateString('pt-BR')}.`}
          {plan !== 'free' && !subEnd && 'Seu plano está ativo.'}
        </p>
      </section>

      {/* Available Plans */}
      {plan === 'free' && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Escolha seu plano</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-5">
            {PLANS.map((p) => {
              const isCurrent = p.key === 'free' && plan === 'free';
              const isSelectable = p.key !== 'free';
              return (
                <button
                  key={p.key}
                  onClick={() => isSelectable && setSelectedPlan(p.key as SelectedPlan)}
                  disabled={!isSelectable}
                  className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                    isCurrent
                      ? 'border-muted bg-muted/30 cursor-default'
                      : isSelectable && selectedPlan === p.key
                      ? 'border-primary bg-primary/5'
                      : isSelectable
                      ? 'border-border hover:border-muted-foreground/30'
                      : 'border-border opacity-60 cursor-default'
                  }`}
                >
                  {p.badge && (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                      {p.badge}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      Atual
                    </span>
                  )}
                  <p className="text-xs font-medium text-muted-foreground mb-1">{p.label}</p>
                  <div className="flex items-baseline gap-0.5 mb-3">
                    <span className="text-2xl font-bold text-foreground">{p.price}</span>
                    <span className="text-xs text-muted-foreground">{p.period}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {p.features.map(f => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          <Button className="w-full h-11" onClick={() => setUpgradeOpen(true)}>
            Assinar agora
          </Button>
        </section>
      )}

      {/* Upgrade from Pro */}
      {plan === 'pro' && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Upgrade para Premium</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Desbloqueie compartilhamento por link, documentos, propostas recebidas e o módulo financeiro.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => { setSelectedPlan('premium_monthly'); setUpgradeOpen(true); }}>
              Premium Mensal — R$59,90/mês
            </Button>
            <Button variant="outline" onClick={() => { setSelectedPlan('premium_yearly'); setUpgradeOpen(true); }}>
              Anual — R$599/ano
            </Button>
          </div>
        </section>
      )}

      {/* Manage Subscription */}
      {plan !== 'free' && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Gerenciar Assinatura</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Altere seu plano, atualize o método de pagamento ou cancele sua assinatura.
          </p>
          <Button variant="outline" className="h-10" onClick={handleManageSubscription}>
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Gerenciar Assinatura
          </Button>
        </section>
      )}

      {/* Checkout Modal */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Plano</DialogTitle>
            <DialogDescription>Revise o plano selecionado antes de continuar</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                {PLANS.find(p => p.key === selectedPlan)?.label}
              </p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-foreground">
                  {PLANS.find(p => p.key === selectedPlan)?.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {PLANS.find(p => p.key === selectedPlan)?.period}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeOpen(false)}>Cancelar</Button>
            <Button onClick={handleCheckout} disabled={checkingOut}>
              {checkingOut ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Processando...</> : 'Continuar para pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
