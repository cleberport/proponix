import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TOUR_SEEN_KEY = 'proponix_tour_seen';

export function resetTour() {
  localStorage.removeItem(TOUR_SEEN_KEY);
}

export function hasTourBeenSeen() {
  return localStorage.getItem(TOUR_SEEN_KEY) === 'true';
}

interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const steps: TourStep[] = [
  {
    target: 'tour-dashboard-header',
    title: 'Dashboard',
    description: 'Aqui você vê e gerencia todos os seus templates de proposta. Crie, edite, duplique e gere PDFs rapidamente.',
  },
  {
    target: 'tour-template-cards',
    title: 'Seus Templates',
    description: 'Cada card é um template. Clique em "Editar" para personalizar ou "Gerar" para criar uma proposta PDF.',
  },
  {
    target: 'tour-new-template',
    title: 'Novo Template',
    description: 'Crie um template do zero com o editor visual. Adicione textos, imagens, tabelas e campos dinâmicos.',
  },
  {
    target: 'tour-starter-templates',
    title: 'Modelos Prontos',
    description: 'Use nossos modelos prontos como ponto de partida. Edite e personalize como quiser.',
  },
  {
    target: 'tour-theme-toggle',
    title: 'Tema',
    description: 'Alterne entre modo claro e escuro conforme sua preferência.',
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getElRect(attr: string): Rect | null {
  const el = document.querySelector(`[data-tour="${attr}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function computeTooltipPos(rect: Rect, isMobile: boolean) {
  const pad = 12;
  const tooltipW = isMobile ? window.innerWidth - 32 : 340;
  const tooltipH = 180;

  // Check if there's space below
  const spaceBelow = window.innerHeight - (rect.top + rect.height + pad);
  const spaceAbove = rect.top - pad;

  let top: number;
  let left: number;

  if (spaceBelow >= tooltipH || spaceBelow >= spaceAbove) {
    top = rect.top + rect.height + pad;
  } else {
    top = rect.top - tooltipH - pad;
  }

  if (isMobile) {
    left = 16;
  } else {
    left = Math.max(16, Math.min(rect.left, window.innerWidth - tooltipW - 16));
  }

  // Clamp top
  top = Math.max(16, Math.min(top, window.innerHeight - tooltipH - 16));

  return { top, left, width: tooltipW };
}

export default function OnboardingTour() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const seen = localStorage.getItem(TOUR_SEEN_KEY);
    if (!seen) {
      const t = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  // Listen for custom event to restart tour
  useEffect(() => {
    const handler = () => {
      setStep(0);
      setShow(true);
    };
    window.addEventListener('proponix-restart-tour', handler);
    return () => window.removeEventListener('proponix-restart-tour', handler);
  }, []);

  const updateRect = useCallback(() => {
    if (!show) return;
    const r = getElRect(steps[step].target);
    setRect(r);
    setIsMobile(window.innerWidth < 768);
  }, [show, step]);

  useEffect(() => {
    updateRect();
    const onResize = () => updateRect();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);

    // Poll for element appearing (lazy loaded content)
    const interval = setInterval(updateRect, 300);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
      clearInterval(interval);
    };
  }, [updateRect]);

  const dismiss = useCallback(() => {
    localStorage.setItem(TOUR_SEEN_KEY, 'true');
    setStep(0);
    setShow(false);
  }, []);

  const next = useCallback(() => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      setStep(-1);
    }
  }, [step]);

  const prev = useCallback(() => {
    if (step > 0) setStep(s => s - 1);
  }, [step]);

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, dismiss, next, prev]);

  if (!show) return null;

  // Completion screen
  if (step === -1) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={dismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-b from-primary/15 to-transparent px-6 pt-10 pb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.15 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
              >
                <Rocket className="h-8 w-8" />
              </motion.div>
              <h2 className="text-xl font-bold text-foreground">Tudo pronto! 🚀</h2>
            </div>
            <div className="px-6 pb-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Você já pode começar a criar propostas com o Proponix.
              </p>
            </div>
            <div className="px-6 pb-6 pt-4">
              <Button onClick={dismiss} className="w-full h-11 font-semibold">
                Começar agora
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const currentStep = steps[step];
  const spotPad = 8;

  const tooltipPos = rect ? computeTooltipPos(rect, isMobile) : null;

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Dark overlay with spotlight cutout via SVG */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - spotPad}
                y={rect.top - spotPad}
                width={rect.width + spotPad * 2}
                height={rect.height + spotPad * 2}
                rx="12"
                ry="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(0,0,0,0.7)"
          mask="url(#spotlight-mask)"
          style={{ pointerEvents: 'auto' }}
          onClick={dismiss}
        />
      </svg>

      {/* Glow ring around target */}
      {rect && (
        <motion.div
          key={`glow-${step}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="absolute rounded-xl ring-2 ring-primary/60 shadow-[0_0_30px_rgba(var(--primary),0.3)]"
          style={{
            top: rect.top - spotPad,
            left: rect.left - spotPad,
            width: rect.width + spotPad * 2,
            height: rect.height + spotPad * 2,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tooltip */}
      {tooltipPos && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`tooltip-${step}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="absolute z-[201] rounded-xl border border-border bg-card shadow-2xl"
            style={{
              top: tooltipPos.top,
              left: tooltipPos.left,
              width: tooltipPos.width,
            }}
          >
            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="p-4 pb-2">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">{currentStep.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              {/* Step indicators */}
              <div className="flex gap-1">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/25'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismiss}
                  className="h-7 px-2 text-[11px] text-muted-foreground"
                >
                  Pular
                </Button>
                {step > 0 && (
                  <Button variant="outline" size="sm" onClick={prev} className="h-7 px-2 text-[11px]">
                    <ArrowLeft className="mr-0.5 h-3 w-3" />
                    Voltar
                  </Button>
                )}
                <Button size="sm" onClick={next} className="h-7 px-3 text-[11px] font-semibold">
                  {step === steps.length - 1 ? 'Finalizar' : 'Próximo'}
                  {step < steps.length - 1 && <ArrowRight className="ml-0.5 h-3 w-3" />}
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
