import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UpgradeModal from '@/components/UpgradeModal';

interface ExpiredOverlayProps {
  /** If true, show the expired overlay */
  show: boolean;
  daysLeft?: number | null;
}

export default function ExpiredOverlay({ show, daysLeft }: ExpiredOverlayProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const navigate = useNavigate();

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
        <div className="mx-4 max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <Lock className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Período de teste expirado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu período de teste de 30 dias terminou. Para continuar usando o Freelox, escolha um plano.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              className="w-full gap-2"
              onClick={() => navigate('/settings?tab=billing')}
            >
              <Sparkles className="h-4 w-4" />
              Ver planos
            </Button>
          </div>
        </div>
      </div>
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        feature="Acesso ao Freelox"
        description="Seu período de teste expirou. Assine para continuar."
      />
    </>
  );
}
