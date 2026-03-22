import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, FileText, Palette, Clock, Zap, Share2, Smartphone, Star } from 'lucide-react';
import '@fontsource/bebas-neue/400.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import mockupEditor from '@/assets/mockup-editor.png';
import mockupProposal from '@/assets/mockup-proposal.png';
import mockupMobile from '@/assets/mockup-mobile.png';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' as const },
  }),
};

const Landing = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);

  const steps = [
    { num: '01', title: 'Escolha um template', desc: 'Templates profissionais prontos para personalizar.', image: mockupEditor },
    { num: '02', title: 'Preencha os dados', desc: 'Cliente, valores e detalhes em poucos campos.', image: mockupMobile },
    { num: '03', title: 'Gere e envie', desc: 'PDF profissional em segundos, pronto para enviar.', image: mockupProposal },
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
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-2xl border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <span className="text-xl font-normal tracking-[0.08em] text-white uppercase" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Proponix<span className="text-primary">.</span>
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
              className="bg-white text-neutral-900 hover:bg-white/90 rounded-full px-5 text-[13px] font-semibold">
              Criar conta
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, #a855f7 40%, #6366f1 70%, #3b82f6 100%)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20 pointer-events-none" />
        {/* Decorative blurred circles */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          className="relative mx-auto max-w-5xl px-5 text-center pt-16"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 mb-8"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Star className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300" />
            <span className="text-xs font-medium text-white/90">Propostas profissionais em segundos</span>
          </motion.div>

          <motion.h1
            className="text-[3.5rem] md:text-[6rem] lg:text-[8rem] font-normal leading-[0.9] tracking-[0.02em] text-white uppercase"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
          >
            Orçamentos<br />
            profissionais<br />
            <span className="bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">em segundos.</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-base md:text-xl text-white/80 max-w-lg mx-auto leading-relaxed font-medium"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
          >
            Crie, envie e tenha propostas aprovadas em minutos — direto do celular.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
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
            <span className="text-sm text-white/40">30 dias grátis • Sem cartão</span>
          </motion.div>

          {/* Hero mockup preview */}
          <motion.div
            className="mt-16 relative mx-auto max-w-3xl"
            initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.7 }}
          >
            <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/30 border border-white/10">
              <img src={mockupEditor} alt="Editor visual do Proponix" className="w-full" loading="lazy" />
            </div>
            {/* Floating proposal card */}
            <motion.div
              className="absolute -bottom-6 -right-4 md:-right-10 w-32 md:w-44 rounded-lg shadow-xl shadow-black/20 border border-white/20 overflow-hidden"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 1.1 }}
            >
              <img src={mockupProposal} alt="Proposta gerada" className="w-full" loading="lazy" />
            </motion.div>
          </motion.div>
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

      {/* How it works — with images */}
      <section id="como-funciona" className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div className="mb-16 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">Como funciona</p>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              Três passos simples.
            </h2>
          </motion.div>

          <div className="space-y-20 md:space-y-28">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-10 md:gap-16`}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              >
                {/* Text */}
                <div className="flex-1 text-center md:text-left">
                  <span className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {s.num}
                  </span>
                  <h3 className="mt-4 text-xl md:text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {s.title}
                  </h3>
                  <p className="mt-3 text-neutral-500 leading-relaxed max-w-sm mx-auto md:mx-0">
                    {s.desc}
                  </p>
                </div>
                {/* Image */}
                <div className="flex-1 relative">
                  <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-neutral-200/50 border border-neutral-100 bg-neutral-50">
                    <img src={s.image} alt={s.title} className="w-full object-cover" loading="lazy" />
                  </div>
                  {/* Decorative gradient behind */}
                  <div className="absolute -z-10 inset-0 translate-x-4 translate-y-4 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-400/10 blur-sm" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 md:py-32 border-t border-neutral-100 bg-neutral-50/50">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div className="mb-14 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">Recursos</p>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              Tudo que você precisa.
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="group rounded-2xl border border-neutral-100 bg-white p-7 hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 transition-all duration-300"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-purple-400/10 group-hover:from-primary/20 group-hover:to-purple-400/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>{f.title}</h3>
                <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Big CTA with image */}
      <section className="relative py-24 md:py-32 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, #a855f7 50%, #6366f1 100%)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-5 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <motion.h2
              className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.05] text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6 }}
            >
              Sua próxima proposta<br />começa aqui.
            </motion.h2>
            <motion.p
              className="mt-5 text-white/70 text-lg max-w-md"
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
          {/* Floating mobile mockup */}
          <motion.div
            className="flex-1 flex justify-center"
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="w-48 md:w-56 rounded-3xl overflow-hidden shadow-2xl shadow-black/30 border-2 border-white/20">
              <img src={mockupMobile} alt="Proponix no celular" className="w-full" loading="lazy" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 md:py-32 bg-white">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div className="mb-14 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">Preços</p>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              Simples e transparente.
            </h2>
            <p className="mt-4 text-neutral-500 max-w-lg mx-auto">Comece grátis. Evolua quando fizer sentido.</p>
          </motion.div>

          <div className="mx-auto grid max-w-4xl gap-8 md:gap-5 md:grid-cols-3">
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
                {plan.highlight && (
                  <div className="mb-4 flex items-center justify-center gap-3">
                    <span className={`text-xs font-medium transition-colors ${!isAnnual ? 'text-neutral-900' : 'text-neutral-400'}`}>Mensal</span>
                    <button
                      onClick={() => setIsAnnual(!isAnnual)}
                      className={`relative h-6 w-10 rounded-full transition-colors ${isAnnual ? 'bg-primary' : 'bg-neutral-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isAnnual ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-xs font-medium transition-colors ${isAnnual ? 'text-neutral-900' : 'text-neutral-400'}`}>
                      Anual <span className="text-[10px] text-primary font-semibold">-14%</span>
                    </span>
                  </div>
                )}
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>{plan.price}</span>
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
          <span className="text-sm font-bold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
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
