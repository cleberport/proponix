import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.4 }
  }),
};

const plans = [
  {
    name: 'Gratuito', price: 'R$ 0', period: '',
    features: ['1 template', '10 PDFs no histórico', 'Marca d\'água Proponix'],
    cta: 'Começar grátis', highlight: false,
  },
  {
    name: 'Pro', price: 'R$ 19,90', period: '/mês',
    features: ['Templates ilimitados', 'PDFs ilimitados', 'Histórico completo', 'Sem marca d\'água', 'Nome personalizado de PDF'],
    cta: 'Assinar Pro', highlight: true,
  },
  {
    name: 'Lifetime', price: 'R$ 197', period: ' único',
    features: ['Todos recursos Pro', 'Acesso vitalício', 'Sem mensalidade'],
    cta: 'Comprar acesso', highlight: false,
  },
];

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Planos e preços</h1>
          <p className="mt-3 text-muted-foreground">Comece grátis, evolua quando precisar</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-2xl p-6 ${
                plan.highlight
                  ? 'border-2 border-primary bg-primary/5 shadow-lg shadow-primary/10'
                  : 'rounded-2xl border border-border bg-card'
              }`}
              initial="hidden" animate="visible" variants={fadeUp} custom={i}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`mt-6 w-full ${plan.highlight ? '' : 'variant-outline'}`}
                variant={plan.highlight ? 'default' : 'outline'}
                onClick={() => navigate('/auth?tab=signup')}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
