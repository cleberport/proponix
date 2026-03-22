import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles, LayoutDashboard, PenTool, FileText, Clock, Settings, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TOUR_SEEN_KEY = 'proponix_tour_seen';

interface TourStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const steps: TourStep[] = [
  {
    icon: <Sparkles className="h-8 w-8" />,
    title: 'Bem-vindo ao Proponix! 🎉',
    description: 'Crie propostas comerciais profissionais em segundos. Vamos conhecer as principais funcionalidades?',
    color: 'from-primary/20 to-primary/5',
  },
  {
    icon: <LayoutDashboard className="h-8 w-8" />,
    title: 'Dashboard',
    description: 'Aqui ficam todos os seus templates. Você pode criar novos, editar, duplicar e gerar PDFs a partir deles.',
    color: 'from-blue-500/20 to-blue-500/5',
  },
  {
    icon: <PenTool className="h-8 w-8" />,
    title: 'Editor de Templates',
    description: 'Personalize seus templates com textos, imagens, tabelas e campos dinâmicos. Arraste e solte para posicionar os elementos.',
    color: 'from-violet-500/20 to-violet-500/5',
  },
  {
    icon: <FileText className="h-8 w-8" />,
    title: 'Gerar Proposta',
    description: 'Preencha os campos dinâmicos e gere o PDF da proposta. No mobile, o compartilhamento abre direto nos seus apps!',
    color: 'from-emerald-500/20 to-emerald-500/5',
  },
  {
    icon: <Clock className="h-8 w-8" />,
    title: 'Histórico',
    description: 'Todas as propostas geradas ficam salvas no histórico para consulta e reenvio rápido.',
    color: 'from-amber-500/20 to-amber-500/5',
  },
  {
    icon: <Settings className="h-8 w-8" />,
    title: 'Configurações',
    description: 'Configure os dados da sua empresa, logo, tema e preferências de geração de PDF.',
    color: 'from-rose-500/20 to-rose-500/5',
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: 'Tudo pronto!',
    description: 'Comece criando um template ou use um dos modelos prontos. Boas propostas! 🚀',
    color: 'from-primary/20 to-primary/5',
  },
];

export default function OnboardingTour() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(TOUR_SEEN_KEY);
    if (!seen) {
      // Small delay so dashboard renders first
      const t = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(TOUR_SEEN_KEY, 'true');
  };

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else dismiss();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!show) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && dismiss()}
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        >
          {/* Gradient header */}
          <div className={`bg-gradient-to-b ${current.color} px-6 pt-8 pb-6 text-center`}>
            <button
              onClick={dismiss}
              className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <motion.div
              key={`icon-${step}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-background/80 text-primary shadow-lg"
            >
              {current.icon}
            </motion.div>

            <h2 className="text-xl font-bold text-foreground">{current.title}</h2>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <p className="text-center text-sm text-muted-foreground leading-relaxed">
              {current.description}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            {/* Step dots */}
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button variant="ghost" size="sm" onClick={prev} className="h-8 px-3 text-xs">
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Voltar
                </Button>
              )}
              <Button size="sm" onClick={next} className="h-8 px-4 text-xs font-semibold">
                {isLast ? 'Começar!' : 'Próximo'}
                {!isLast && <ArrowRight className="ml-1 h-3 w-3" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
