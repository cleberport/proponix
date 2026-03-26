import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TOUR_SEEN_KEY = 'freelox_tour_seen';

export function resetTour() {
  localStorage.removeItem(TOUR_SEEN_KEY);
}

export function hasTourBeenSeen() {
  return localStorage.getItem(TOUR_SEEN_KEY) === 'true';
}

interface TourStep {
  target: string;
  title: string;
  description: string;
}

const steps: TourStep[] = [
  {
    target: 'tour-dashboard-header',
    title: 'Dashboard',
    description: 'Aqui você vê e gerencia todos os seus templates de proposta.',
  },
  {
    target: 'tour-template-cards',
    title: 'Seus Templates',
    description: 'Cada card é um template. Toque para editar ou gerar uma proposta.',
  },
  {
    target: 'tour-new-template',
    title: 'Novo Template',
    description: 'Crie um template do zero com o editor visual.',
  },
  {
    target: 'tour-starter-templates',
    title: 'Modelos Prontos',
    description: 'Use nossos modelos prontos como ponto de partida.',
  },
  {
    target: 'tour-theme-toggle',
    title: 'Tema',
    description: 'Alterne entre modo claro e escuro.',
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
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/** Filter steps to only those whose target element exists in the DOM */
function getAvailableSteps(): TourStep[] {
  return steps.filter(s => {
    const el = document.querySelector(`[data-tour="${s.target}"]`);
    return el && el.getBoundingClientRect().width > 0;
  });
}

export default function OnboardingTour() {
  const [show, setShow] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [availableSteps, setAvailableSteps] = useState<TourStep[]>([]);
  const [rect, setRect] = useState<Rect | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(TOUR_SEEN_KEY);
    if (!seen) {
      const t = setTimeout(() => {
        const available = getAvailableSteps();
        if (available.length > 0) {
          setAvailableSteps(available);
          setShow(true);
        }
      }, 800);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      const available = getAvailableSteps();
      if (available.length > 0) {
        setAvailableSteps(available);
        setStepIndex(0);
        setCompleted(false);
        setShow(true);
      }
    };
    window.addEventListener('freelox-restart-tour', handler);
    return () => window.removeEventListener('freelox-restart-tour', handler);
  }, []);

  const updateRect = useCallback(() => {
    if (!show || completed || availableSteps.length === 0) return;
    const current = availableSteps[stepIndex];
    if (!current) return;
    const r = getElRect(current.target);
    setRect(r);
    setIsMobile(window.innerWidth < 768);
  }, [show, stepIndex, completed, availableSteps]);

  useEffect(() => {
    updateRect();
    const onResize = () => updateRect();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    const interval = setInterval(updateRect, 300);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
      clearInterval(interval);
    };
  }, [updateRect]);

  const dismiss = useCallback(() => {
    localStorage.setItem(TOUR_SEEN_KEY, 'true');
    setStepIndex(0);
    setCompleted(false);
    setShow(false);
  }, []);

  const next = useCallback(() => {
    if (stepIndex < availableSteps.length - 1) {
      setStepIndex(s => s + 1);
    } else {
      setCompleted(true);
    }
  }, [stepIndex, availableSteps.length]);

  const prev = useCallback(() => {
    if (stepIndex > 0) setStepIndex(s => s - 1);
  }, [stepIndex]);

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
  if (completed) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
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
                Você já pode começar a criar propostas com o Freelox.
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

  if (availableSteps.length === 0) return null;

  const currentStep = availableSteps[stepIndex];
  const spotPad = 8;
  const totalSteps = availableSteps.length;

  // Compute tooltip position
  let tooltipStyle: React.CSSProperties;
  const tooltipW = isMobile ? window.innerWidth - 32 : 340;

  if (rect) {
    const pad = 12;
    const tooltipH = 160;
    const spaceBelow = window.innerHeight - (rect.top + rect.height + pad);
    const spaceAbove = rect.top - pad;

    let top: number;
    if (spaceBelow >= tooltipH || spaceBelow >= spaceAbove) {
      top = rect.top + rect.height + pad;
    } else {
      top = rect.top - tooltipH - pad;
    }

    const left = isMobile ? 16 : Math.max(16, Math.min(rect.left, window.innerWidth - tooltipW - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipH - 16));

    tooltipStyle = { top, left, width: tooltipW, position: 'absolute' };
  } else {
    // Centered fallback when element isn't measurable
    tooltipStyle = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: tooltipW,
      position: 'absolute',
    };
  }

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Dark overlay with spotlight cutout */}
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

      {/* Glow ring */}
      {rect && (
        <motion.div
          key={`glow-${stepIndex}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="absolute rounded-xl ring-2 ring-primary/60"
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
      <AnimatePresence mode="wait">
        <motion.div
          key={`tooltip-${stepIndex}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="z-[201] rounded-xl border border-border bg-card shadow-2xl"
          style={tooltipStyle}
        >
          <button
            onClick={dismiss}
            className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="p-4 pb-2">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <h3 className="font-semibold text-sm text-foreground">{currentStep.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <div className="flex gap-1">
              {availableSteps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === stepIndex ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/25'
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
              {stepIndex > 0 && (
                <Button variant="outline" size="sm" onClick={prev} className="h-7 px-2 text-[11px]">
                  <ArrowLeft className="mr-0.5 h-3 w-3" />
                  Voltar
                </Button>
              )}
              <Button size="sm" onClick={next} className="h-7 px-3 text-[11px] font-semibold">
                {stepIndex === totalSteps - 1 ? 'Finalizar' : 'Próximo'}
                {stepIndex < totalSteps - 1 && <ArrowRight className="ml-0.5 h-3 w-3" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
