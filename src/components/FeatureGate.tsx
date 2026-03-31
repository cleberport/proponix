import { Lock } from 'lucide-react';
import { useState, ReactNode } from 'react';
import UpgradeModal from '@/components/UpgradeModal';
import { useSubscription, Feature } from '@/contexts/SubscriptionContext';

interface FeatureGateProps {
  feature: Feature;
  featureLabel: string;
  description: string;
  requiredPlan?: 'pro' | 'premium';
  children: ReactNode;
  /** If true, show children but with overlay */
  viewOnly?: boolean;
}

export default function FeatureGate({ feature, featureLabel, description, requiredPlan = 'premium', children, viewOnly = false }: FeatureGateProps) {
  const { canUseFeature } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (canUseFeature(feature)) {
    return <>{children}</>;
  }

  if (viewOnly) {
    return (
      <div className="relative">
        <div className="pointer-events-none opacity-60 select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px] rounded-lg">
          <button
            onClick={() => setUpgradeOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 shadow-sm hover:shadow-md transition-shadow pointer-events-auto"
          >
            <Lock className="h-4 w-4 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Recurso Premium</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </button>
        </div>
        <UpgradeModal
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          feature={featureLabel}
          description={description}
          requiredPlan={requiredPlan}
        />
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setUpgradeOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 shadow-sm hover:shadow-md transition-shadow w-full"
      >
        <Lock className="h-4 w-4 text-muted-foreground" />
        <div className="text-left">
          <p className="text-sm font-medium text-foreground">{featureLabel}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </button>
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        feature={featureLabel}
        description={description}
        requiredPlan={requiredPlan}
      />
    </>
  );
}
