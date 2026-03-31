import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Loader2, Sparkles, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PLAN_CONFIG } from '@/contexts/SubscriptionContext';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  description: string;
  requiredPlan?: 'pro' | 'premium';
}

const PLAN_BENEFITS: Record<string, string[]> = {
  pro: [
    'Templates ilimitados',
    'Sem marca d\'água',
    'Geração ilimitada de PDF',
  ],
  premium: [
    'Tudo do Pro',
    'Compartilhamento por link',
    'Módulo de Documentos completo',
    'Propostas Recebidas',
    'Módulo Financeiro completo',
    'Automações e E-mails',
  ],
};

export default function UpgradeModal({ open, onOpenChange, feature, description, requiredPlan = 'premium' }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  const priceId = requiredPlan === 'pro'
    ? PLAN_CONFIG.pro.monthly_price_id
    : PLAN_CONFIG.premium.monthly_price_id;

  const planLabel = requiredPlan === 'pro' ? 'Pro' : 'Premium';
  const price = requiredPlan === 'pro' ? 'R$19,90' : 'R$59,90';

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const fnName = 'create-checkout';
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: any) {
      toast.error('Erro ao iniciar checkout: ' + (err?.message || 'Tente novamente'));
    } finally {
      setLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{feature}</DialogTitle>
          <DialogDescription className="text-center">{description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Plano {planLabel}</span>
            <span className="ml-auto text-lg font-bold text-foreground">{price}<span className="text-xs text-muted-foreground font-normal">/mês</span></span>
          </div>
          <ul className="space-y-2">
            {PLAN_BENEFITS[requiredPlan].map(b => (
              <li key={b} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full h-11" onClick={handleUpgrade} disabled={loading}>
            {loading ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Processando...</> : `Assinar ${planLabel}`}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Agora não
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
