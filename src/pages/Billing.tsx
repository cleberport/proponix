import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Check, CreditCard, AlertTriangle, Sparkles, Crown, ExternalLink, RefreshCw, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

// Stripe price IDs
const PRICES = {
  monthly: 'price_1TEw2WDKwRkyWIIaFkZujCF6',
  yearly: 'price_1TEw3UDKwRkyWIIaNc6lhAjW',
  lifetime: 'price_1TExQ6DKwRkyWIIa87r8TU6X',
};

interface SubscriptionState {
  subscribed: boolean;
  lifetime: boolean;
  price_id: string | null;
  product_id: string | null;
  subscription_end: string | null;
}

interface UserProfile {
  status: string;
  trial_end: string;
}

const PLAN_FEATURES = [
  'Templates ilimitados',
  'Envio por link',
  'Histórico completo',
  'Sem marca d\'água',
];

type SelectedPlan = 'monthly' | 'yearly' | 'lifetime';

const BillingPage = () => {
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sub, setSub] = useState<SubscriptionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>('monthly');

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSub(data as SubscriptionState);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('status, trial_end')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setProfile(data);
      await checkSubscription();
      setLoading(false);
    };
    load();
  }, [checkSubscription]);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Assinatura realizada com sucesso!');
      checkSubscription();
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout cancelado.');
    }
  }, [searchParams, checkSubscription]);

  useEffect(() => {
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkSubscription();
    setRefreshing(false);
    toast.success('Status atualizado');
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const priceId = PRICES[selectedPlan];
      const isLifetime = selectedPlan === 'lifetime';
      const fnName = isLifetime ? 'create-payment' : 'create-checkout';

      const { data, error } = await supabase.functions.invoke(fnName, {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
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
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      toast.error('Erro ao abrir portal: ' + (err?.message || 'Tente novamente'));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isSubscribed = sub?.subscribed === true;
  const isLifetime = sub?.lifetime === true;
  const profileStatus = profile?.status || 'trial';
  const effectiveStatus = isSubscribed ? 'active' : profileStatus;
  const trialEnd = profile?.trial_end ? new Date(profile.trial_end) : null;
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : 0;
  const subEnd = sub?.subscription_end ? new Date(sub.subscription_end) : null;
  const isYearly = sub?.price_id === PRICES.yearly;

  const planLabel = isLifetime ? 'Vitalício' : isYearly ? 'Anual' : 'Mensal';

  const planOptions: { key: SelectedPlan; label: string; price: string; period: string; badge?: string }[] = [
    { key: 'monthly', label: 'Mensal', price: 'R$19', period: '/mês' },
    { key: 'yearly', label: 'Anual', price: 'R$197', period: '/ano', badge: '2 meses grátis' },
    { key: 'lifetime', label: 'Vitalício', price: 'R$397', period: 'único', badge: 'Oferta limitada' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">Faturamento</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seu plano e assinatura</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing} className="h-9 w-9">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {effectiveStatus === 'expired' && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">Seu acesso expirou</p>
            <p className="text-xs text-muted-foreground mt-0.5">Assine um plano para continuar usando o Freelox.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {/* Plan Status */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Status do Plano</h2>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              effectiveStatus === 'active'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                : effectiveStatus === 'trial'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {effectiveStatus === 'active' && <><Crown className="h-3 w-3" /> Plano Pro ({planLabel})</>}
              {effectiveStatus === 'trial' && <><Sparkles className="h-3 w-3" /> Teste Gratuito</>}
              {effectiveStatus === 'expired' && <><AlertTriangle className="h-3 w-3" /> Expirado</>}
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            {effectiveStatus === 'trial' && daysLeft > 0 && `Seu teste termina em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}.`}
            {effectiveStatus === 'trial' && daysLeft === 0 && 'Seu teste termina hoje.'}
            {effectiveStatus === 'active' && isLifetime && 'Seu plano vitalício está ativo. Acesso para sempre.'}
            {effectiveStatus === 'active' && !isLifetime && subEnd && `Seu plano está ativo. Próxima renovação em ${subEnd.toLocaleDateString('pt-BR')}.`}
            {effectiveStatus === 'active' && !isLifetime && !subEnd && 'Seu plano está ativo.'}
            {effectiveStatus === 'expired' && 'Seu acesso expirou.'}
          </p>
        </section>

        {/* Available Plans */}
        {!isSubscribed && (
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Escolha seu plano</h2>

            <div className="grid gap-3 sm:grid-cols-3 mb-5">
              {planOptions.map((plan) => (
                <button
                  key={plan.key}
                  onClick={() => setSelectedPlan(plan.key)}
                  className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                    selectedPlan === plan.key
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                      {plan.badge}
                    </span>
                  )}
                  <p className="text-xs font-medium text-muted-foreground mb-1">{plan.label}</p>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-xs text-muted-foreground">{plan.period}</span>
                  </div>
                </button>
              ))}
            </div>

            <ul className="flex flex-col gap-2.5 mb-5">
              {PLAN_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  {f}
                </li>
              ))}
              {selectedPlan === 'lifetime' && (
                <li className="flex items-center gap-2 text-sm text-foreground">
                  <Star className="h-4 w-4 text-primary shrink-0" />
                  Acesso para sempre — sem mensalidade
                </li>
              )}
            </ul>

            <Button className="w-full h-11" onClick={() => setUpgradeOpen(true)}>
              Assinar agora
            </Button>
          </section>
        )}

        {/* Manage Subscription (subscribed, non-lifetime) */}
        {isSubscribed && !isLifetime && (
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Gerenciar Assinatura</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Altere seu plano, atualize o método de pagamento ou cancele sua assinatura pelo portal do Stripe.
            </p>
            <Button variant="outline" className="h-10" onClick={handleManageSubscription}>
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Gerenciar no Stripe
            </Button>
          </section>
        )}
      </div>

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
                Plano Pro — {planOptions.find(p => p.key === selectedPlan)?.label}
              </p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-foreground">
                  {planOptions.find(p => p.key === selectedPlan)?.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {planOptions.find(p => p.key === selectedPlan)?.period}
                </span>
              </div>
              {planOptions.find(p => p.key === selectedPlan)?.badge && (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary mt-2">
                  {planOptions.find(p => p.key === selectedPlan)?.badge}
                </span>
              )}
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
};

export default BillingPage;
