import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Check, CreditCard, AlertTriangle, Sparkles, Crown, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

// Stripe price IDs
const PRICES = {
  monthly: 'price_1TEw2WDKwRkyWIIaFkZujCF6',
  yearly: 'price_1TEw3UDKwRkyWIIaNc6lhAjW',
};

interface SubscriptionState {
  subscribed: boolean;
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

const BillingPage = () => {
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sub, setSub] = useState<SubscriptionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

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

  // Handle success redirect
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Assinatura realizada com sucesso!');
      checkSubscription();
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout cancelado.');
    }
  }, [searchParams, checkSubscription]);

  // Auto-refresh subscription every 60s
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
      const priceId = annual ? PRICES.yearly : PRICES.monthly;
      const { data, error } = await supabase.functions.invoke('create-checkout', {
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
  const profileStatus = profile?.status || 'trial';
  const effectiveStatus = isSubscribed ? 'active' : profileStatus;
  const trialEnd = profile?.trial_end ? new Date(profile.trial_end) : null;
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : 0;
  const subEnd = sub?.subscription_end ? new Date(sub.subscription_end) : null;
  const isYearly = sub?.price_id === PRICES.yearly;

  const price = annual ? 'R$197' : 'R$19';
  const period = annual ? '/ano' : '/mês';
  const savings = annual ? '2 meses grátis' : null;

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

      {/* Expired banner */}
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
        {/* Section 1 — Plan Status */}
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
              {effectiveStatus === 'active' && <><Crown className="h-3 w-3" /> Plano Pro {isYearly ? '(Anual)' : '(Mensal)'}</>}
              {effectiveStatus === 'trial' && <><Sparkles className="h-3 w-3" /> Teste Gratuito</>}
              {effectiveStatus === 'expired' && <><AlertTriangle className="h-3 w-3" /> Expirado</>}
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            {effectiveStatus === 'trial' && daysLeft > 0 && `Seu teste termina em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}.`}
            {effectiveStatus === 'trial' && daysLeft === 0 && 'Seu teste termina hoje.'}
            {effectiveStatus === 'active' && subEnd && `Seu plano está ativo. Próxima renovação em ${subEnd.toLocaleDateString('pt-BR')}.`}
            {effectiveStatus === 'active' && !subEnd && 'Seu plano está ativo.'}
            {effectiveStatus === 'expired' && 'Seu acesso expirou.'}
          </p>
        </section>

        {/* Section 2 — Available Plans (show when not subscribed) */}
        {!isSubscribed && (
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Plano Pro</h2>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>Mensal</span>
                <Switch checked={annual} onCheckedChange={setAnnual} />
                <span className={`text-xs font-medium ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>Anual</span>
              </div>
            </div>

            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold text-foreground">{price}</span>
              <span className="text-sm text-muted-foreground">{period}</span>
            </div>
            {savings && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary mb-4">
                {savings}
              </span>
            )}

            <ul className="flex flex-col gap-2.5 mt-4 mb-5">
              {PLAN_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Button className="w-full h-11" onClick={() => setUpgradeOpen(true)}>
              Assinar agora
            </Button>
          </section>
        )}

        {/* Section 3 — Account Actions (subscribed) */}
        {isSubscribed && (
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Gerenciar Assinatura</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Altere seu plano, atualize o método de pagamento ou cancele sua assinatura pelo portal do Stripe.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="h-10" onClick={handleManageSubscription}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Gerenciar no Stripe
              </Button>
            </div>
          </section>
        )}
      </div>

      {/* Upgrade Modal */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assinar Plano Pro</DialogTitle>
            <DialogDescription>Escolha o período da sua assinatura</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className={`text-sm font-medium ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>Mensal</span>
              <Switch checked={annual} onCheckedChange={setAnnual} />
              <span className={`text-sm font-medium ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>Anual</span>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
              <p className="text-sm text-muted-foreground mb-1">Plano Pro</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-foreground">{price}</span>
                <span className="text-sm text-muted-foreground">{period}</span>
              </div>
              {savings && (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary mt-2">
                  {savings}
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
