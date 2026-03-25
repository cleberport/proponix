import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Check, FileText, Palette, Clock, Zap, Share2,
  Smartphone, Star, Shield, Award, Users, ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import '@fontsource/space-grotesk/300.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';

const font = "'Space Grotesk', sans-serif";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: 'easeOut' as const },
  }),
};

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const Landing = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);

  const features = [
    { icon: Palette, title: 'Editor Visual Drag & Drop', desc: 'Arraste elementos, ajuste cores, fontes e layout com total liberdade criativa.' },
    { icon: Zap, title: 'PDF Instantâneo', desc: 'Gere documentos profissionais em menos de 3 segundos. Pronto para enviar.' },
    { icon: Smartphone, title: '100% Mobile', desc: 'Crie e envie propostas de qualquer lugar, direto do celular.' },
    { icon: Clock, title: 'Histórico Completo', desc: 'Acesse, pesquise e reutilize qualquer proposta gerada anteriormente.' },
    { icon: FileText, title: 'Templates Ilimitados', desc: 'Crie modelos personalizados para cada tipo de serviço que você oferece.' },
    { icon: Share2, title: 'Compartilhe em 1 Toque', desc: 'WhatsApp, e-mail ou qualquer app. Envie propostas instantaneamente.' },
  ];

  const steps = [
    { num: '01', title: 'Crie seu template', desc: 'Monte seu modelo com o editor visual ou importe um PDF existente.' },
    { num: '02', title: 'Preencha pelo celular', desc: 'Adicione cliente, valores e detalhes em poucos campos simples.' },
    { num: '03', title: 'Envie pelo WhatsApp', desc: 'PDF profissional pronto em segundos. Compartilhe por qualquer app.' },
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
    <div className="min-h-screen bg-white" style={{ fontFamily: font }}>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-100">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-neutral-900">Freelox</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-neutral-500 font-medium">
            <a href="#features" className="hover:text-neutral-900 transition-colors">Funcionalidades</a>
            <a href="#como-funciona" className="hover:text-neutral-900 transition-colors">Como Funciona</a>
            <a href="#pricing" className="hover:text-neutral-900 transition-colors">Preços</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}
              className="text-neutral-600 hover:text-neutral-900 text-sm font-medium">
              Entrar
            </Button>
            <Button size="sm" onClick={() => navigate('/auth?tab=signup')}
              className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-full px-5 text-sm font-semibold">
              Começar Grátis
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-44 md:pb-24">
        <div className="relative mx-auto max-w-4xl px-5 text-center">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-600 shadow-sm mb-8"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          >
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Novo: Importação Inteligente de PDF com IA
          </motion.div>

          <motion.h1
            className="text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] font-bold leading-[1.05] tracking-[-0.03em] text-neutral-900"
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          >
            Seu orçamento já está pronto.
            <br />
            Só preencher e enviar.
          </motion.h1>

          <motion.p
            className="mt-6 text-base md:text-lg leading-relaxed max-w-2xl mx-auto text-neutral-500 inline-flex items-center justify-center gap-2 flex-wrap"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          >
            Preencha pelo celular e envie seu PDF pelo{' '}
            <span className="inline-flex items-center gap-1">
              <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
              <span>WhatsApp</span>
            </span>{' '}
            em minutos.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }}
          >
            <Button
              size="lg"
              onClick={() => navigate('/auth?tab=signup')}
              className="h-14 px-10 text-base font-semibold rounded-full group bg-neutral-900 text-white hover:bg-neutral-800 shadow-xl"
            >
              Criar Minha Primeira Proposta
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('#pricing')}
              className="h-14 px-10 text-base font-semibold rounded-full border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            >
              Ver Planos
            </Button>
          </motion.div>

          <motion.div
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-400"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          >
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Sem cartão de crédito</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Teste grátis por 30 dias</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Templates profissionais</span>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div className="mb-14 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-neutral-900">
              Tudo o que você precisa
            </h2>
            <p className="mt-4 text-neutral-500 max-w-lg mx-auto">
              Ferramentas poderosas desenhadas para freelancers e agências que buscam profissionalismo e agilidade.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="group rounded-2xl p-7 bg-white border border-neutral-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
                  <f.icon className="h-5 w-5 text-neutral-700" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-5">
          <motion.div className="mb-16 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-neutral-900">
              Como funciona
            </h2>
            <p className="mt-4 text-neutral-500">Três passos simples para criar propostas profissionais.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                className="text-center"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <span className="text-5xl font-bold text-neutral-200">{s.num}</span>
                <h3 className="mt-4 text-lg font-bold text-neutral-900">{s.title}</h3>
                <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-neutral-50">
        <div className="relative mx-auto max-w-3xl px-5 text-center">
          <motion.h2
            className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.08] text-neutral-900"
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
          >
            Sua próxima proposta<br />começa aqui.
          </motion.h2>
          <motion.p
            className="mt-5 text-lg text-neutral-500 max-w-md mx-auto"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.2 }}
          >
            Crie sua conta e envie sua primeira proposta em menos de 2 minutos.
          </motion.p>
          <motion.div className="mt-10 flex flex-col sm:flex-row gap-3 items-center justify-center"
            initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.3 }}
          >
            <Button
              size="lg"
              onClick={() => navigate('/auth?tab=signup')}
              className="h-14 px-10 text-base font-semibold rounded-full group bg-neutral-900 text-white hover:bg-neutral-800 shadow-xl"
            >
              Criar conta grátis
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/auth')}
              className="h-14 px-10 text-base font-semibold rounded-full border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            >
              Já tenho conta
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div className="mb-14 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-neutral-900">
              Simples e transparente.
            </h2>
            <p className="mt-4 max-w-lg mx-auto text-neutral-500">
              Comece grátis. Evolua quando fizer sentido.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-4xl gap-6 md:gap-5 md:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl p-7 transition-all ${
                  plan.highlight
                    ? 'bg-neutral-900 text-white border-2 border-neutral-900 shadow-2xl'
                    : 'bg-white border border-neutral-200 shadow-sm'
                }`}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-bold text-white uppercase tracking-wider"
                    style={{ background: '#f43f5e' }}>
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
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${plan.highlight ? 'text-white/50' : 'text-neutral-400'}`}>{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className={`text-3xl font-bold ${plan.highlight ? 'text-white' : 'text-neutral-900'}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? 'text-white/50' : 'text-neutral-400'}`}>{plan.period}</span>
                </div>
                {(plan as any).sub && (
                  <p className={`mt-1 text-xs ${plan.highlight ? 'text-white/40' : 'text-neutral-400'}`}>{(plan as any).sub}</p>
                )}
                <ul className="mt-7 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2.5 text-sm ${plan.highlight ? 'text-white/70' : 'text-neutral-600'}`}>
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
                      ? 'bg-white text-neutral-900 hover:bg-neutral-100'
                      : 'bg-neutral-900 text-white hover:bg-neutral-800'
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
      <footer className="py-10 border-t border-neutral-100">
        <div className="mx-auto max-w-6xl px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-neutral-900 flex items-center justify-center">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-neutral-900">Freelox</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-neutral-400">
            <button onClick={() => navigate('/auth')} className="hover:text-neutral-900 transition-colors">Entrar</button>
            <button onClick={() => navigate('/auth?tab=signup')} className="hover:text-neutral-900 transition-colors">Criar conta</button>
            <button onClick={() => navigate('/pricing')} className="hover:text-neutral-900 transition-colors">Preços</button>
          </div>
          <p className="text-xs text-neutral-400">© {new Date().getFullYear()} Freelox</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
