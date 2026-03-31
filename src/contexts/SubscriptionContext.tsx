import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PlanType = 'free' | 'pro' | 'premium';

export const PLAN_CONFIG = {
  pro: {
    product_id: 'prod_UFPhF7cipmYyWM',
    monthly_price_id: 'price_1TGusZDKwRkyWIIaw4kiS7Iq',
  },
  premium: {
    product_id: 'prod_UFPialps5j20kP',
    monthly_price_id: 'price_1TGut3DKwRkyWIIaWVl7d2hi',
    yearly_price_id: 'price_1TGuySDKwRkyWIIawqjWRjWr',
  },
} as const;

interface SubscriptionState {
  plan: PlanType;
  loading: boolean;
  subscriptionEnd: string | null;
  priceId: string | null;
  isYearly: boolean;
  isExpired: boolean;
  trialEnd: string | null;
}

interface SubscriptionContextType extends SubscriptionState {
  refresh: () => Promise<void>;
  canUseFeature: (feature: Feature) => boolean;
  maxTemplates: number;
  showWatermark: boolean;
  daysLeft: number | null;
}

export type Feature =
  | 'link_sharing'
  | 'documents_full'
  | 'received_full'
  | 'finance_full'
  | 'unlimited_templates'
  | 'automations'
  | 'email_system';

const FEATURE_ACCESS: Record<Feature, PlanType[]> = {
  link_sharing: ['premium'],
  documents_full: ['premium'],
  received_full: ['premium'],
  finance_full: ['premium'],
  unlimited_templates: ['pro', 'premium'],
  automations: ['premium'],
  email_system: ['premium'],
};

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SubscriptionState>({
    plan: 'free',
    loading: true,
    subscriptionEnd: null,
    priceId: null,
    isYearly: false,
    isExpired: false,
    trialEnd: null,
  });

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState(s => ({ ...s, plan: 'free', loading: false, isExpired: false, trialEnd: null }));
        return;
      }

      // Fetch profile for trial info
      const { data: profile } = await supabase
        .from('profiles')
        .select('trial_end, status')
        .eq('user_id', session.user.id)
        .single();

      const trialEnd = profile?.trial_end || null;

      // Check Stripe subscription
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;

      const productId = data?.product_id;
      let plan: PlanType = 'free';

      if (data?.subscribed) {
        if (productId === PLAN_CONFIG.premium.product_id || productId === 'manual_premium') {
          plan = 'premium';
        } else if (productId === PLAN_CONFIG.pro.product_id || productId === 'manual_pro') {
          plan = 'pro';
        } else {
          plan = 'premium'; // Legacy subscribers
        }
      }

      // Check trial expiration for free users
      let isExpired = false;
      if (plan === 'free' && trialEnd) {
        isExpired = new Date(trialEnd) < new Date();
      }

      setState({
        plan,
        loading: false,
        subscriptionEnd: data?.subscription_end || null,
        priceId: data?.price_id || null,
        isYearly: data?.price_id === PLAN_CONFIG.premium.yearly_price_id,
        isExpired,
        trialEnd,
      });
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });
    return () => subscription.unsubscribe();
  }, [checkSubscription]);

  const canUseFeature = useCallback((feature: Feature): boolean => {
    if (state.isExpired) return false;
    const allowed = FEATURE_ACCESS[feature];
    return allowed.includes(state.plan);
  }, [state.plan, state.isExpired]);

  const maxTemplates = state.plan === 'free' ? 1 : Infinity;
  const showWatermark = state.plan === 'free';

  // Calculate days left in trial
  const daysLeft = state.trialEnd && state.plan === 'free'
    ? Math.max(0, Math.ceil((new Date(state.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <SubscriptionContext.Provider value={{
      ...state,
      refresh: checkSubscription,
      canUseFeature,
      maxTemplates,
      showWatermark,
      daysLeft,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
