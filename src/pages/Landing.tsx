import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Check, FileText, Palette, Clock, Zap, Share2,
  Smartphone, Star, Shield, Award, Users, ChevronRight,
} from 'lucide-react';
import '@fontsource/space-grotesk/300.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import mockupEditor from '@/assets/mockup-editor.png';
import mockupProposal from '@/assets/mockup-proposal.png';
import mockupMobile from '@/assets/mockup-mobile.png';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: 'easeOut' as const },
  }),
};

const Landing = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);

  const trustBadges = [
    { icon: Shield, stat: '100%', label: 'Seguro', sub: 'Dados criptografados e protegidos', color: 'from-emerald-500 to-teal-600' },
    { icon: Zap, stat: '< 3s', label: 'PDF Gerado', sub: 'Propostas prontas em segundos', color: 'from-amber-500 to-orange-600' },
    { icon: Star, stat: '4.9', label: 'Avaliação', sub: 'Nota dos usuários ativos', color: 'from-pink-500 to-rose-600', stars: true },
    { icon: Users, stat: '1.000+', label: 'Profissionais', sub: 'Já usam o Freelox', color: 'from-blue-500 to-indigo-600' },
    { icon: Award, stat: 'Top 1', label: 'em propostas', sub: 'Ferramenta nº1 para freelancers', color: 'from-purple-500 to-violet-600' },
  ];

  const features = [
    { icon: Palette, title: 'Editor Visual Drag & Drop', desc: 'Arraste elementos, ajuste cores, fontes e layout com total liberdade criativa.' },
    { icon: Zap, title: 'PDF Instantâneo', desc: 'Gere documentos profissionais em menos de 3 segundos. Pronto para enviar.' },
    { icon: Smartphone, title: '100% Mobile', desc: 'Crie e envie propostas de qualquer lugar, direto do celular.' },
    { icon: Clock, title: 'Histórico Completo', desc: 'Acesse, pesquise e reutilize qualquer proposta gerada anteriormente.' },
    { icon: FileText, title: 'Templates Ilimitados', desc: 'Crie modelos personalizados para cada tipo de serviço que você oferece.' },
    { icon: Share2, title: 'Compartilhe em 1 Toque', desc: 'WhatsApp, e-mail ou qualquer app. Envie propostas instantaneamente.' },
  ];

  const steps = [
    { num: '01', title: 'Escolha um modelo', desc: 'Comece com templates profissionais prontos ou crie o seu do zero.', image: mockupEditor },
    { num: '02', title: 'Preencha os dados', desc: 'Adicione cliente, valores e detalhes em poucos campos simples.', image: mockupMobile },
    { num: '03', title: 'Gere e envie', desc: 'PDF profissional pronto em segundos. Compartilhe por qualquer app.', image: mockupProposal },
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
    <div className="min-h-screen" style={{ fontFamily: "'Space Grotesk', sans-serif", background: '#1e1535' }}>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(30, 21, 53, 0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <span className="text-xl font-semibold tracking-[0.06em] text-white uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Freelox<span style={{ color: '#f43f5e' }}>.</span>
          </span>
          <div className="hidden md:flex items-center gap-8 text-[13px] text-white/60 font-medium">
            <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
            <a href="#features" className="hover:text-white transition-colors">Recursos</a>
            <a href="#pricing" className="hover:text-white transition-colors">Preços</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}
              className="text-white/60 hover:text-white hover:bg-white/10 text-[13px]">
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
      <section className="relative pt-32 pb-8 md:pt-40 md:pb-12 overflow-hidden">
        {/* Gradient glow behind */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(168,85,247,0.15) 0%, transparent 70%)' }} />

        <div className="relative mx-auto max-w-4xl px-5 text-center">
          <motion.p
            className="text-sm md:text-base font-medium mb-6"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          >
            Comece a sua avaliação de 30 dias do Freelox e veja como criar propostas profissionais. e veja como criar propostas profissionais.
          </motion.p>

          <motion.h1
            className="text-[2.2rem] sm:text-[3rem] md:text-[4.2rem] lg:text-[5rem] font-semibold leading-[1.05] tracking-[-0.02em] text-white"
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          >
            Organize tudo com o<br />
            <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              novo Freelox
            </span>
          </motion.h1>

          <motion.p
            className="mt-6 text-base md:text-lg leading-relaxed max-w-2xl mx-auto"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          >
            O Freelox cria propostas profissionais, gera PDFs instantâneos e organiza todo o seu fluxo de orçamentos. profissionais, gera PDFs instantâneos e organiza todo o seu fluxo de orçamentos. 
            Obtenha propostas poderosas e encante seus clientes.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }}
          >
            <Button
              size="lg"
              onClick={() => navigate('/auth?tab=signup')}
              className="h-14 px-10 text-base font-semibold rounded-full group shadow-2xl"
              style={{ background: '#f43f5e', color: '#fff' }}
            >
              Começar Grátis
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/auth')}
              className="h-14 px-10 text-base font-semibold rounded-full border-white/20 text-white hover:bg-white/10"
            >
              Já tenho conta
            </Button>
          </motion.div>

          <motion.p
            className="mt-4 text-xs"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          >
            30 dias de teste grátis • Sem cartão de crédito
          </motion.p>
        </div>
      </section>

      {/* Trust badges — colorful cards row */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
          >
            {trustBadges.map((badge, i) => (
              <motion.div
                key={badge.label}
                className={`relative rounded-2xl p-5 md:p-6 text-center overflow-hidden bg-gradient-to-br ${badge.color}`}
                variants={fadeUp} custom={i}
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
              >
                <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                <div className="relative">
                  <badge.icon className="h-6 w-6 text-white/70 mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-bold text-white">{badge.stat}</p>
                  <p className="text-xs font-semibold text-white/90 uppercase tracking-wider mt-0.5">{badge.label}</p>
                  {badge.stars && (
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                      {[1,2,3,4,5].map(s => <Star key={s} className="h-3 w-3 text-yellow-300 fill-yellow-300" />)}
                    </div>
                  )}
                  <p className="text-[10px] text-white/60 mt-2 leading-tight">{badge.sub}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Hero mockup screenshot */}
      <section className="pb-16 md:pb-24">
        <motion.div
          className="mx-auto max-w-4xl px-5"
          initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.9 }}
        >
          <div className="relative rounded-2xl overflow-hidden" style={{ boxShadow: '0 20px 80px rgba(168,85,247,0.15), 0 8px 32px rgba(0,0,0,0.4)' }}>
            {/* macOS-style dots */}
            <div className="flex items-center gap-1.5 px-4 py-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            <img src={mockupEditor} alt="Editor visual do Freelox" className="w-full block" loading="lazy" />
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 md:py-28" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="mx-auto max-w-6xl px-5">
          <motion.div className="mb-16 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] mb-3" style={{ color: '#f43f5e' }}>Como funciona</p>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
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
                <div className="flex-1 text-center md:text-left">
                  <span className="text-5xl md:text-7xl font-bold bg-gradient-to-br from-pink-500 to-purple-500 bg-clip-text text-transparent">
                    {s.num}
                  </span>
                  <h3 className="mt-4 text-xl md:text-2xl font-bold text-white">{s.title}</h3>
                  <p className="mt-3 leading-relaxed max-w-sm mx-auto md:mx-0" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {s.desc}
                  </p>
                </div>
                <div className="flex-1 relative">
                  <div className="relative rounded-xl overflow-hidden" style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}>
                    <img src={s.image} alt={s.title} className="w-full block" loading="lazy" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div className="mb-14 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] mb-3" style={{ color: '#f43f5e' }}>Recursos</p>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
              Tudo que você precisa.
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="group rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(168,85,247,0.15))' }}>
                  <f.icon className="h-5 w-5" style={{ color: '#f43f5e' }} />
                </div>
                <h3 className="text-base font-bold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Big CTA */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(244,63,94,0.08), transparent)' }} />
        <div className="relative mx-auto max-w-6xl px-5 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <motion.h2
              className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.08] text-white"
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6 }}
            >
              Sua próxima proposta<br />começa aqui.
            </motion.h2>
            <motion.p
              className="mt-5 text-lg max-w-md"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
              viewport={{ once: true }} transition={{ delay: 0.2 }}
            >
              Crie sua conta e envie sua primeira proposta em menos de 2 minutos.
            </motion.p>
            <motion.div className="mt-10 flex flex-col sm:flex-row gap-3 items-center md:items-start"
              initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.3 }}
            >
              <Button
                size="lg"
                onClick={() => navigate('/auth?tab=signup')}
                className="h-14 px-10 text-base font-semibold rounded-full group shadow-2xl"
                style={{ background: '#f43f5e', color: '#fff' }}
              >
                Criar conta grátis
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/auth')}
                className="h-14 px-10 text-base font-semibold rounded-full border-white/20 text-white hover:bg-white/10"
              >
                Já tenho conta
              </Button>
            </motion.div>
          </div>
          <motion.div
            className="flex-1 flex justify-center"
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="w-48 md:w-56 rounded-3xl overflow-hidden border-2 border-white/10"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              <img src={mockupMobile} alt="Freelox no celular" className="w-full" loading="lazy" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="mx-auto max-w-6xl px-5">
          <motion.div className="mb-14 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] mb-3" style={{ color: '#f43f5e' }}>Preços</p>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white">
              Simples e transparente.
            </h2>
            <p className="mt-4 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Comece grátis. Evolua quando fizer sentido.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-4xl gap-6 md:gap-5 md:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className="relative flex flex-col rounded-2xl p-7 transition-all"
                style={{
                  background: plan.highlight ? 'rgba(244,63,94,0.06)' : 'rgba(255,255,255,0.03)',
                  border: plan.highlight ? '2px solid rgba(244,63,94,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: plan.highlight ? '0 8px 40px rgba(244,63,94,0.1)' : 'none',
                }}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-bold text-white uppercase tracking-wider"
                    style={{ background: 'linear-gradient(135deg, #f43f5e, #a855f7)' }}>
                    Mais escolhido
                  </span>
                )}
                {plan.highlight && (
                  <div className="mb-4 flex items-center justify-center gap-3">
                    <span className={`text-xs font-medium transition-colors ${!isAnnual ? 'text-white' : 'text-white/40'}`}>Mensal</span>
                    <button
                      onClick={() => setIsAnnual(!isAnnual)}
                      className="relative h-6 w-10 rounded-full transition-colors"
                      style={{ background: isAnnual ? '#f43f5e' : 'rgba(255,255,255,0.2)' }}
                    >
                      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isAnnual ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-xs font-medium transition-colors ${isAnnual ? 'text-white' : 'text-white/40'}`}>
                      Anual <span className="text-[10px] font-semibold" style={{ color: '#f43f5e' }}>-14%</span>
                    </span>
                  </div>
                )}
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{plan.period}</span>
                </div>
                {(plan as any).sub && (
                  <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{(plan as any).sub}</p>
                )}
                <ul className="mt-7 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      <Check className="h-4 w-4 shrink-0" style={{ color: '#f43f5e' }} />
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
                      ? 'text-white hover:opacity-90'
                      : 'text-white hover:bg-white/10'
                  }`}
                  style={{
                    background: plan.highlight
                      ? 'linear-gradient(135deg, #f43f5e, #a855f7)'
                      : 'rgba(255,255,255,0.08)',
                  }}
                  onClick={() => navigate('/auth?tab=signup')}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-20 text-center">
        <div className="mx-auto max-w-2xl px-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Pronto para criar propostas incríveis?
            </h2>
            <p className="mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Junte-se a milhares de profissionais que já usam o Freelox.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/auth?tab=signup')}
              className="h-14 px-10 text-base font-semibold rounded-full group"
              style={{ background: '#f43f5e', color: '#fff' }}
            >
              Começar agora
              <ChevronRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mx-auto max-w-6xl px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold tracking-tight text-white">
            Freelox<span style={{ color: '#f43f5e' }}>.</span>
          </span>
          <div className="flex items-center gap-6 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <button onClick={() => navigate('/auth')} className="hover:text-white transition-colors">Entrar</button>
            <button onClick={() => navigate('/auth?tab=signup')} className="hover:text-white transition-colors">Criar conta</button>
            <button onClick={() => navigate('/pricing')} className="hover:text-white transition-colors">Preços</button>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}><p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>© {new Date().getFullYear()} Freelox</p></p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
