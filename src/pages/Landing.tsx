import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  FileText, Palette, Clock, Zap, Share2, Smartphone,
  ArrowRight, Check, Sparkles, ChevronRight
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 }
  }),
};

const Landing = () => {
  const navigate = useNavigate();

  const steps = [
    { num: '01', title: 'Escolha um template', desc: 'Selecione entre templates profissionais prontos para uso.' },
    { num: '02', title: 'Preencha os dados', desc: 'Adicione cliente, valores e detalhes em poucos campos.' },
    { num: '03', title: 'Envie e aprove', desc: 'Compartilhe a proposta e receba aprovação online.' },
  ];

  const features = [
    { icon: Palette, title: 'Templates personalizados', desc: 'Crie e customize templates para cada tipo de serviço.' },
    { icon: FileText, title: 'Editor visual', desc: 'Arraste e solte elementos no editor intuitivo.' },
    { icon: Clock, title: 'Histórico completo', desc: 'Acesse todas as propostas geradas anteriormente.' },
    { icon: Zap, title: 'PDF instantâneo', desc: 'Gere documentos profissionais em menos de 3 segundos.' },
    { icon: Share2, title: 'Compartilhe fácil', desc: 'Envie por WhatsApp, e-mail ou qualquer app.' },
    { icon: Smartphone, title: 'Feito para mobile', desc: 'Interface otimizada para criar propostas pelo celular.' },
  ];

  const audiences = [
    'Freelancers', 'Fotógrafos', 'Designers', 'Agências', 'Produtores', 'Prestadores de serviço'
  ];

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

  return (
    <div className="min-h-screen bg-[hsl(var(--landing-bg))] text-[hsl(var(--landing-fg))]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-bg)/0.8)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">Proponix</span>
          </div>
          <div className="hidden items-center gap-6 text-sm text-[hsl(var(--landing-muted))] md:flex">
            <a href="#features" className="hover:text-[hsl(var(--landing-fg))] transition-colors">Funcionalidades</a>
            <a href="#pricing" className="hover:text-[hsl(var(--landing-fg))] transition-colors">Preços</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}
              className="text-[hsl(var(--landing-fg))] hover:bg-[hsl(var(--landing-card))]">
              Entrar
            </Button>
            <Button size="sm" onClick={() => navigate('/auth?tab=signup')}
              className="bg-primary hover:bg-primary/90">
              Criar conta
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="landing-gradient absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 md:pt-32 md:pb-32">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" /> Envie propostas. Receba aprovações.
              </span>
            </motion.div>
            <motion.h1
              className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl"
              initial="hidden" animate="visible" variants={fadeUp} custom={1}
            >
              Propostas{' '}
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                profissionais
              </span>{' '}
              em segundos
            </motion.h1>
            <motion.p
              className="mx-auto mt-6 max-w-xl text-lg text-[hsl(var(--landing-muted))] md:text-xl"
              initial="hidden" animate="visible" variants={fadeUp} custom={2}
            >
              Crie, envie e aprove propostas em PDF direto do celular.
              Sem complicação, sem planilhas.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
              initial="hidden" animate="visible" variants={fadeUp} custom={3}
            >
              <Button size="lg" onClick={() => navigate('/auth?tab=signup')}
                className="h-12 w-full px-8 text-base font-semibold sm:w-auto bg-primary hover:bg-primary/90">
                Criar conta grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
                className="h-12 w-full px-8 text-base sm:w-auto border-[hsl(var(--landing-border))] text-[hsl(var(--landing-fg))] hover:bg-[hsl(var(--landing-card))]">
                Ver como funciona
              </Button>
            </motion.div>
          </div>

          {/* Phone mockup */}
          <motion.div
            className="mx-auto mt-16 max-w-sm"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            <div className="relative mx-auto w-[260px] rounded-[2.5rem] border-2 border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-card))] p-3 shadow-2xl shadow-primary/10">
              <div className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-[hsl(var(--landing-bg))]" />
              <div className="mt-4 rounded-[2rem] bg-[hsl(var(--landing-bg))] p-4 pt-6">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold">Proponix</span>
                </div>
                <div className="mb-2 h-2.5 w-3/4 rounded bg-primary/20" />
                <div className="mb-4 h-2 w-1/2 rounded bg-[hsl(var(--landing-border))]" />
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-[hsl(var(--landing-card))] p-2.5">
                      <div className="h-8 w-8 rounded-md bg-primary/20" />
                      <div className="flex-1 space-y-1">
                        <div className="h-2 w-3/4 rounded bg-[hsl(var(--landing-border))]" />
                        <div className="h-1.5 w-1/2 rounded bg-[hsl(var(--landing-border)/0.5)]" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 h-9 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-white">Gerar PDF</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-[hsl(var(--landing-border))] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Como funciona</h2>
            <p className="mt-3 text-[hsl(var(--landing-muted))]">Três passos simples para criar sua proposta</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                className="glass-card rounded-2xl p-6"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <span className="text-4xl font-black text-primary/30">{s.num}</span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-[hsl(var(--landing-muted))]">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-[hsl(var(--landing-border))] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Tudo que você precisa</h2>
            <p className="mt-3 text-[hsl(var(--landing-muted))]">Ferramentas profissionais, interface simples</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="glass-card group rounded-2xl p-6 transition-colors hover:border-primary/30"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-[hsl(var(--landing-muted))]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="border-t border-[hsl(var(--landing-border))] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Para quem é</h2>
          <p className="mx-auto mt-3 max-w-lg text-[hsl(var(--landing-muted))]">
            Perfeito para profissionais que precisam enviar propostas rapidamente
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {audiences.map((a) => (
              <span key={a} className="rounded-full border border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-card))] px-5 py-2.5 text-sm font-medium">
                {a}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-[hsl(var(--landing-border))] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Planos e preços</h2>
            <p className="mt-3 text-[hsl(var(--landing-muted))]">Comece grátis, evolua quando precisar</p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`relative rounded-2xl p-6 ${
                  plan.highlight
                    ? 'border-2 border-primary bg-primary/5 shadow-lg shadow-primary/10'
                    : 'glass-card'
                }`}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
                    Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  <span className="text-sm text-[hsl(var(--landing-muted))]">{plan.period}</span>
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
                  className={`mt-6 w-full ${plan.highlight ? 'bg-primary hover:bg-primary/90' : 'bg-[hsl(var(--landing-card))] hover:bg-[hsl(var(--landing-border))] text-[hsl(var(--landing-fg))]'}`}
                  onClick={() => navigate('/auth?tab=signup')}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[hsl(var(--landing-border))] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Comece grátis hoje</h2>
          <p className="mx-auto mt-4 max-w-md text-[hsl(var(--landing-muted))]">
            Crie sua conta e envie sua primeira proposta em menos de 2 minutos.
          </p>
          <Button
            size="lg"
            className="mt-8 h-12 px-8 text-base font-semibold bg-primary hover:bg-primary/90"
            onClick={() => navigate('/auth?tab=signup')}
          >
            Criar conta
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--landing-border))] py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Proponix</span>
          </div>
          <p className="text-xs text-[hsl(var(--landing-muted))]">© {new Date().getFullYear()} Proponix</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
