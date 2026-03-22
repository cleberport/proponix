import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, FileText, Palette, Clock, Zap, Share2, Smartphone } from 'lucide-react';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import { useRef } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' as const },
  }),
};

const Landing = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.8], [0, -60]);

  const steps = [
    { num: '01', title: 'Escolha um template', desc: 'Templates profissionais prontos para personalizar.' },
    { num: '02', title: 'Preencha os dados', desc: 'Cliente, valores e detalhes em poucos campos.' },
    { num: '03', title: 'Gere e envie', desc: 'PDF profissional em segundos, pronto para enviar.' },
  ];

  const features = [
    { icon: Palette, title: 'Editor Visual', desc: 'Arraste elementos, ajuste cores e tipografia com controle total.' },
    { icon: Zap, title: 'PDF Instantâneo', desc: 'Documentos profissionais gerados em menos de 3 segundos.' },
    { icon: Smartphone, title: 'Mobile First', desc: 'Crie e envie propostas direto do celular.' },
    { icon: Clock, title: 'Histórico Completo', desc: 'Acesse, pesquise e reutilize qualquer proposta.' },
    { icon: FileText, title: 'Templates Ilimitados', desc: 'Crie templates únicos para cada serviço.' },
    { icon: Share2, title: 'Compartilhe Fácil', desc: 'WhatsApp, e-mail ou qualquer app com um toque.' },
  ];

  const audiences = [
    'Freelancers', 'Fotógrafos', 'Designers', 'Agências', 'Produtores', 'Consultores', 'Arquitetos', 'Prestadores de serviço'
  ];

  const plans = [
    {
      name: 'Teste grátis', price: 'Grátis', period: '30 dias',
      features: ['Todos os recursos liberados', 'Sem limitações durante o teste'],
      cta: 'Começar grátis', highlight: false,
    },
    {
      name: 'Pro', price: 'R$ 19', period: '/mês',
      sub: 'ou R$197/ano (2 meses grátis)',
      features: ['Templates ilimitados', 'Biblioteca de serviços', 'Geração de PDF profissional', 'Envio por link com aprovação', 'Reenvio de propostas', 'Histórico completo', 'Sem marca d\'água'],
      cta: 'Começar a fechar mais clientes', highlight: true,
    },
    {
      name: 'Vitalício', price: 'R$ 397', period: ' único',
      features: ['Tudo do plano Pro', 'Acesso para sempre', 'Sem mensalidade'],
      cta: 'Garantir acesso vitalício', highlight: false,
      urgency: '🔥 Oferta limitada para primeiros usuários',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/60 backdrop-blur-2xl border-b border-white/5">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <span className="text-lg font-bold tracking-tight">
            Proponix<span className="text-primary">.</span>
          </span>
          <div className="hidden md:flex items-center gap-8 text-[13px] text-neutral-400 font-medium">
            <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
            <a href="#features" className="hover:text-white transition-colors">Recursos</a>
            <a href="#pricing" className="hover:text-white transition-colors">Preços</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}
              className="text-neutral-400 hover:text-white hidden sm:inline-flex text-[13px]">
              Entrar
            </Button>
            <Button size="sm" onClick={() => navigate('/auth?tab=signup')}
              className="bg-white text-neutral-950 hover:bg-neutral-200 rounded-full px-5 text-[13px] font-medium">
              Criar conta
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-[100vh] flex items-center overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[40%] -left-[20%] w-[70vw] h-[70vw] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute -bottom-[30%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-purple-500/6 blur-[100px]" />
        </div>

        <motion.div
          className="relative mx-auto max-w-6xl px-5 pt-24"
          style={{ opacity: heroOpacity, y: heroY }}
        >
          <motion.div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-neutral-300">Propostas profissionais em segundos</span>
          </motion.div>

          <motion.h1
            className="text-[2.8rem] md:text-[4.5rem] lg:text-[5.5rem] font-bold leading-[1.02] tracking-[-0.03em]"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          >
            Propostas que<br />
            <span className="bg-gradient-to-r from-primary via-pink-400 to-purple-400 bg-clip-text text-transparent">
              fecham negócios.
            </span>
          </motion.h1>

          <motion.p
            className="mt-6 text-lg md:text-xl text-neutral-400 leading-relaxed max-w-lg"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
          >
            Gere PDFs com design profissional direto do celular.<br className="hidden md:block" />
            Sem planilhas, sem complicação.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-start gap-4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button
              size="lg"
              onClick={() => navigate('/auth?tab=signup')}
              className="h-14 px-10 text-base font-semibold bg-white text-neutral-950 hover:bg-neutral-200 rounded-full group"
            >
              Começar grátis
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
              className="h-14 px-8 text-base text-neutral-400 hover:text-white hover:bg-white/5 rounded-full"
            >
              Ver como funciona
            </Button>
          </motion.div>

          {/* Audience tags */}
          <motion.div
            className="mt-20 flex flex-wrap items-center gap-2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.8 }}
          >
            <span className="text-xs text-neutral-500 mr-1">Para:</span>
            {audiences.map((a) => (
              <span key={a} className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-[11px] font-medium text-neutral-400">
                {a}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-28 md:py-36 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div className="mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">Como funciona</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Três passos.<br />
              <span className="text-neutral-500">Nenhuma complicação.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                className="bg-neutral-950 p-8 md:p-10"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <span className="text-5xl font-bold text-white/5">{s.num}</span>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 md:py-36 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div className="mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">Recursos</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Tudo que você precisa.<br />
              <span className="text-neutral-500">Nada que você não precisa.</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] p-7 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Big CTA */}
      <section className="py-28 md:py-36 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[40vw] rounded-full bg-primary/5 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-5 text-center">
          <motion.h2
            className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]"
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
          >
            Sua próxima proposta<br />
            <span className="text-neutral-500">começa aqui.</span>
          </motion.h2>
          <motion.p
            className="mt-5 text-neutral-400 text-lg max-w-md mx-auto"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.2 }}
          >
            Crie sua conta e envie sua primeira proposta em menos de 2 minutos.
          </motion.p>
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.3 }}
          >
            <Button
              size="lg"
              onClick={() => navigate('/auth?tab=signup')}
              className="h-14 px-10 text-base font-semibold bg-white text-neutral-950 hover:bg-neutral-200 rounded-full group"
            >
              Criar conta grátis
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-28 md:py-36 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div className="mb-16 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">Preços</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Simples e transparente.
            </h2>
            <p className="mt-4 text-neutral-400 max-w-lg mx-auto">
              Comece grátis. Evolua quando fizer sentido.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl p-7 transition-all ${
                  plan.highlight
                    ? 'border-2 border-primary bg-white/[0.04] shadow-[0_0_60px_-15px_hsl(var(--primary)/0.2)]'
                    : 'border border-white/8 bg-white/[0.02]'
                }`}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                    Mais escolhido
                  </span>
                )}
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-neutral-500">{plan.period}</span>
                </div>
                {(plan as any).sub && (
                  <p className="mt-1 text-xs text-neutral-500">{(plan as any).sub}</p>
                )}
                <ul className="mt-7 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-neutral-300">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                {(plan as any).urgency && (
                  <p className="mt-5 text-center text-sm font-medium text-orange-400">{(plan as any).urgency}</p>
                )}
                <Button
                  className={`mt-7 w-full rounded-full h-11 text-sm font-semibold ${
                    plan.highlight
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'bg-white/10 hover:bg-white/15 text-white'
                  }`}
                  onClick={() => navigate('/auth?tab=signup')}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto max-w-6xl px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold tracking-tight">
            Proponix<span className="text-primary">.</span>
          </span>
          <div className="flex items-center gap-6 text-xs text-neutral-500">
            <button onClick={() => navigate('/auth')} className="hover:text-white transition-colors">Entrar</button>
            <button onClick={() => navigate('/auth?tab=signup')} className="hover:text-white transition-colors">Criar conta</button>
            <button onClick={() => navigate('/pricing')} className="hover:text-white transition-colors">Preços</button>
          </div>
          <p className="text-xs text-neutral-600">© {new Date().getFullYear()} Proponix</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
