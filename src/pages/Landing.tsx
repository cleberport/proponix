import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, FileText, Palette, Clock, Zap, Share2, Smartphone } from 'lucide-react';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/bebas-neue/400.css';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' as const },
  }),
};

const Landing = () => {
  const navigate = useNavigate();

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

  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Teste grátis', price: 'Grátis', period: '30 dias',
      features: ['Todos os recursos liberados', 'Sem limitações durante o teste'],
      cta: 'Começar grátis', highlight: false,
    },
    {
      name: 'Pro',
      price: isAnnual ? 'R$ 197' : 'R$ 19',
      period: isAnnual ? '/ano' : '/mês',
      sub: isAnnual ? 'equivale a ~R$16/mês (2 meses grátis)' : 'ou R$197/ano (2 meses grátis)',
      features: ['Templates ilimitados', 'Biblioteca de serviços', 'Geração de PDF profissional', 'Envio por link com aprovação', 'Reenvio de propostas', 'Histórico completo', 'Sem marca d\'água'],
      cta: isAnnual ? 'Assinar anual — R$197/ano' : 'Assinar mensal — R$19/mês',
      highlight: true,
    },
    {
      name: 'Vitalício', price: 'R$ 397', period: ' único',
      features: ['Tudo do plano Pro', 'Acesso para sempre', 'Sem mensalidade'],
      cta: 'Garantir acesso vitalício', highlight: false,
      urgency: '🔥 Oferta limitada para primeiros usuários',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Nav — transparent over hero */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <span className="text-lg font-bold tracking-tight text-white">
            Proponix<span className="opacity-80">.</span>
          </span>
          <div className="hidden md:flex items-center gap-8 text-[13px] text-white/70 font-medium">
            <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
            <a href="#features" className="hover:text-white transition-colors">Recursos</a>
            <a href="#pricing" className="hover:text-white transition-colors">Preços</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}
              className="text-white/70 hover:text-white hover:bg-white/10 hidden sm:inline-flex text-[13px]">
              Entrar
            </Button>
            <Button size="sm" onClick={() => navigate('/auth?tab=signup')}
              className="bg-white text-neutral-900 hover:bg-white/90 rounded-full px-5 text-[13px] font-medium">
              Criar conta
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero — gradient background like aprilford */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, #a855f7 40%, #6366f1 70%, #3b82f6 100%)',
        }}
      >
        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20 pointer-events-none" />

        <motion.div
          className="relative mx-auto max-w-5xl px-5 text-center pt-16"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
        >
          <motion.p
            className="text-sm md:text-base font-medium text-white/80 tracking-widest uppercase mb-6"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          >
            Propostas profissionais em segundos
          </motion.p>

          <motion.h1
            className="text-[3rem] md:text-[5rem] lg:text-[6.5rem] font-bold leading-[0.95] tracking-[-0.02em] text-white uppercase"
            style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 400 }}
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
          >
            Orçamentos<br />
            profissionais<br />
            em segundos.
          </motion.h1>

          <motion.p
            className="mt-6 text-base md:text-lg text-white/70 max-w-md mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
          >
            Crie, envie e tenha propostas aprovadas em minutos — direto do celular.
          </motion.p>

          <motion.div
            className="mt-10"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Button
              size="lg"
              onClick={() => navigate('/auth?tab=signup')}
              className="h-14 px-10 text-base font-semibold bg-white text-neutral-900 hover:bg-white/90 rounded-full group shadow-2xl shadow-black/20"
            >
              Começar grátis
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>

          <motion.p
            className="mt-5 text-sm text-white/50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          >
            Mais rápido que planilha. Mais profissional que PDF manual.
          </motion.p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2.5 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Audience strip */}
      <div className="border-b border-neutral-100 py-5 bg-white">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-center gap-2 md:gap-3 justify-center">
            <span className="text-xs font-medium text-neutral-400 mr-2">Feito para:</span>
            {audiences.map((a) => (
              <span key={a} className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <section id="como-funciona" className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div className="mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">Como funciona</p>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
              Três passos simples.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                className="rounded-2xl border border-neutral-100 bg-neutral-50/50 p-7 hover:shadow-md hover:border-neutral-200 transition-all duration-300"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <span className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">{s.num}</span>
                <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 md:py-32 border-t border-neutral-100 bg-neutral-50/50">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div className="mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">Recursos</p>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Tudo que você precisa.</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="group rounded-2xl border border-neutral-100 bg-white p-7 hover:shadow-md hover:border-neutral-200 transition-all duration-300"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-purple-400/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Big CTA */}
      <section className="relative py-24 md:py-32 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, #a855f7 50%, #6366f1 100%)',
        }}
      >
        <div className="relative mx-auto max-w-3xl px-5 text-center">
          <motion.h2
            className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.05] text-white"
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
          >
            Sua próxima proposta<br />começa aqui.
          </motion.h2>
          <motion.p
            className="mt-5 text-white/70 text-lg max-w-md mx-auto"
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
              className="h-14 px-10 text-base font-semibold bg-white text-neutral-900 hover:bg-white/90 rounded-full group shadow-2xl shadow-black/20"
            >
              Criar conta grátis
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 md:py-32 bg-white">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div className="mb-14 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">Preços</p>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Simples e transparente.</h2>
            <p className="mt-4 text-neutral-500 max-w-lg mx-auto">Comece grátis. Evolua quando fizer sentido.</p>

            {/* Toggle mensal/anual */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-neutral-900' : 'text-neutral-400'}`}>Mensal</span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative h-7 w-12 rounded-full transition-colors ${isAnnual ? 'bg-primary' : 'bg-neutral-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${isAnnual ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-neutral-900' : 'text-neutral-400'}`}>
                Anual <span className="text-xs text-primary font-semibold">-14%</span>
              </span>
            </div>
          </motion.div>

          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl p-7 transition-all ${
                  plan.highlight
                    ? 'border-2 border-primary bg-primary/[0.02] shadow-lg shadow-primary/10'
                    : 'border border-neutral-200 bg-white'
                }`}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-purple-500 px-4 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                    Mais escolhido
                  </span>
                )}
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-neutral-400">{plan.period}</span>
                </div>
                {(plan as any).sub && (
                  <p className="mt-1 text-xs text-neutral-400">{(plan as any).sub}</p>
                )}
                <ul className="mt-7 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-neutral-600">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                {(plan as any).urgency && (
                  <p className="mt-5 text-center text-sm font-medium text-orange-600">{(plan as any).urgency}</p>
                )}
                <Button
                  className={`mt-7 w-full rounded-full h-11 text-sm font-semibold ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-primary to-purple-500 text-white hover:opacity-90'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
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
      <footer className="border-t border-neutral-100 py-10 bg-white">
        <div className="mx-auto max-w-6xl px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold tracking-tight">
            Proponix<span className="text-primary">.</span>
          </span>
          <div className="flex items-center gap-6 text-xs text-neutral-400">
            <button onClick={() => navigate('/auth')} className="hover:text-neutral-900 transition-colors">Entrar</button>
            <button onClick={() => navigate('/auth?tab=signup')} className="hover:text-neutral-900 transition-colors">Criar conta</button>
            <button onClick={() => navigate('/pricing')} className="hover:text-neutral-900 transition-colors">Preços</button>
          </div>
          <p className="text-xs text-neutral-400">© {new Date().getFullYear()} Proponix</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
