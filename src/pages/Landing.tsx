import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, FileText, Palette, Clock, Zap, Share2, Smartphone } from 'lucide-react';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5 }
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
    <div className="min-h-screen bg-white text-neutral-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-100">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <span className="text-lg font-bold tracking-tight">
            Proponix<span className="text-primary">.</span>
          </span>
          <div className="hidden md:flex items-center gap-8 text-[13px] text-neutral-500 font-medium">
            <a href="#como-funciona" className="hover:text-neutral-900 transition-colors">Como funciona</a>
            <a href="#features" className="hover:text-neutral-900 transition-colors">Recursos</a>
            <a href="#pricing" className="hover:text-neutral-900 transition-colors">Preços</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}
              className="text-neutral-600 hover:text-neutral-900 hidden sm:inline-flex text-[13px]">
              Entrar
            </Button>
            <Button size="sm" onClick={() => navigate('/auth?tab=signup')}
              className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-full px-5 text-[13px] font-medium">
              Criar conta
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-20 md:pt-32 md:pb-28">
        <div className="mx-auto max-w-6xl px-5">
          <div className="max-w-2xl">
            <motion.div
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/8 border border-primary/15 px-3 py-1"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs font-medium text-primary">Propostas profissionais em segundos</span>
            </motion.div>

            <motion.h1
              className="text-[2.5rem] md:text-[3.5rem] lg:text-[4rem] font-bold leading-[1.08] tracking-tight text-neutral-900"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            >
              Crie propostas que{' '}
              <span className="text-primary">fecham negócios.</span>
            </motion.h1>

            <motion.p
              className="mt-5 text-base md:text-lg text-neutral-500 leading-relaxed max-w-lg"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            >
              Gere PDFs com design profissional direto do celular.
              Sem planilhas, sem complicação.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-col sm:flex-row items-start gap-3"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button
                size="lg"
                onClick={() => navigate('/auth?tab=signup')}
                className="h-12 px-8 text-sm font-semibold bg-neutral-900 text-white hover:bg-neutral-800 rounded-full group"
              >
                Começar grátis
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-12 px-6 text-sm text-neutral-500 hover:text-neutral-900"
              >
                Ver como funciona
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Audience strip */}
      <div className="border-y border-neutral-100 py-5">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <span className="text-xs font-medium text-neutral-400 mr-2">Para:</span>
            {audiences.map((a) => (
              <span key={a} className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600">
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <section id="como-funciona" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div className="mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Como funciona</p>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">Três passos simples.</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                className="rounded-xl border border-neutral-150 bg-neutral-50/50 p-6 hover:border-neutral-300 transition-colors"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <span className="text-3xl font-bold text-primary/20">{s.num}</span>
                <h3 className="mt-3 text-base font-semibold text-neutral-900">{s.title}</h3>
                <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28 border-t border-neutral-100">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div className="mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Recursos</p>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">Tudo que você precisa.</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="rounded-xl border border-neutral-150 bg-white p-6 hover:shadow-sm transition-all"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900">{f.title}</h3>
                <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 border-t border-neutral-100">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <motion.h2
            className="text-2xl md:text-4xl font-bold text-neutral-900 tracking-tight"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            Sua próxima proposta começa aqui.
          </motion.h2>
          <motion.p
            className="mt-4 text-neutral-500 max-w-md mx-auto"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.15 }}
          >
            Crie sua conta e envie sua primeira proposta em menos de 2 minutos.
          </motion.p>
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.25 }}
          >
            <Button
              size="lg"
              onClick={() => navigate('/auth?tab=signup')}
              className="h-12 px-8 text-sm font-semibold bg-neutral-900 text-white hover:bg-neutral-800 rounded-full group"
            >
              Criar conta grátis
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28 border-t border-neutral-100 bg-neutral-50/50">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div className="mb-12 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Preços</p>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">Pare de perder clientes por demora no orçamento.</h2>
            <p className="mt-3 text-neutral-500 max-w-lg mx-auto text-sm">Crie, envie e tenha propostas aprovadas em minutos — direto do celular.</p>
          </motion.div>

          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`relative rounded-xl p-6 transition-all ${
                  plan.highlight
                    ? 'border-2 border-primary bg-white shadow-lg shadow-primary/5'
                    : 'border border-neutral-200 bg-white'
                }`}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                {plan.highlight && (
                  <span className="absolute -top-2.5 left-5 rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wider">
                    Popular
                  </span>
                )}
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-neutral-900">{plan.price}</span>
                  <span className="text-sm text-neutral-400">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-neutral-600">
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`mt-6 w-full rounded-full h-10 text-sm font-medium ${
                    plan.highlight
                      ? 'bg-primary text-white hover:bg-primary/90'
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
      <footer className="border-t border-neutral-100 py-8">
        <div className="mx-auto max-w-6xl px-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-sm font-bold tracking-tight">
            Proponix<span className="text-primary">.</span>
          </span>
          <div className="flex items-center gap-5 text-xs text-neutral-400">
            <button onClick={() => navigate('/auth')} className="hover:text-neutral-600 transition-colors">Entrar</button>
            <button onClick={() => navigate('/auth?tab=signup')} className="hover:text-neutral-600 transition-colors">Criar conta</button>
          </div>
          <p className="text-xs text-neutral-400">© {new Date().getFullYear()} Proponix</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
