import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, ArrowUpRight, Sparkles } from 'lucide-react';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/syne/700.css';
import '@fontsource/syne/800.css';
import { useRef } from 'react';

const Landing = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const steps = [
    { num: '01', title: 'Escolha um template', desc: 'Templates profissionais prontos para personalizar.' },
    { num: '02', title: 'Preencha os dados', desc: 'Cliente, valores e detalhes em poucos campos.' },
    { num: '03', title: 'Gere e envie', desc: 'PDF profissional em segundos, pronto para enviar.' },
  ];

  const features = [
    { title: 'Editor Visual', desc: 'Arraste elementos, ajuste cores e tipografia com controle total.' },
    { title: 'PDF Instantâneo', desc: 'Documentos profissionais gerados em menos de 3 segundos.' },
    { title: 'Mobile First', desc: 'Crie e envie propostas direto do celular, a qualquer momento.' },
    { title: 'Histórico Completo', desc: 'Acesse, pesquise e reutilize qualquer proposta anterior.' },
    { title: 'Templates Ilimitados', desc: 'Crie templates únicos para cada tipo de serviço.' },
    { title: 'Compartilhe Fácil', desc: 'WhatsApp, e-mail ou qualquer app com um toque.' },
  ];

  const audiences = [
    'Freelancers', 'Fotógrafos', 'Designers', 'Agências', 'Produtores', 'Consultores', 'Arquitetos', 'Prestadores de serviço'
  ];

  const plans = [
    {
      name: 'Free', price: 'R$ 0', period: '',
      features: ['1 template', '10 PDFs no histórico', 'Marca d\'água Proponix'],
      cta: 'Começar grátis', highlight: false,
    },
    {
      name: 'Pro', price: 'R$ 19,90', period: '/mês',
      features: ['Templates ilimitados', 'PDFs ilimitados', 'Histórico completo', 'Sem marca d\'água', 'Nome personalizado'],
      cta: 'Assinar Pro', highlight: true,
    },
    {
      name: 'Lifetime', price: 'R$ 197', period: ' único',
      features: ['Todos recursos Pro', 'Acesso vitalício', 'Sem mensalidade'],
      cta: 'Comprar acesso', highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--landing-bg))] text-[hsl(var(--landing-fg))] overflow-x-hidden" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[hsl(var(--landing-bg)/0.6)] backdrop-blur-2xl">
        <div className="mx-auto flex h-16 md:h-20 max-w-[1400px] items-center justify-between px-5 md:px-10">
          <span className="text-xl md:text-2xl font-bold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            Proponix<span className="text-primary">.</span>
          </span>
          <div className="hidden md:flex items-center gap-8 text-sm text-[hsl(var(--landing-muted))]">
            <a href="#como-funciona" className="hover:text-[hsl(var(--landing-fg))] transition-colors duration-300">Como funciona</a>
            <a href="#features" className="hover:text-[hsl(var(--landing-fg))] transition-colors duration-300">Recursos</a>
            <a href="#pricing" className="hover:text-[hsl(var(--landing-fg))] transition-colors duration-300">Preços</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}
              className="text-[hsl(var(--landing-fg))] hover:bg-[hsl(var(--landing-card))] hidden sm:inline-flex">
              Entrar
            </Button>
            <Button size="sm" onClick={() => navigate('/auth?tab=signup')}
              className="bg-[hsl(var(--landing-fg))] text-[hsl(var(--landing-bg))] hover:bg-[hsl(var(--landing-fg)/0.85)] rounded-full px-5 font-semibold text-xs uppercase tracking-wider">
              Criar conta
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 pb-10 md:pb-0">
        {/* Gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] md:w-[900px] md:h-[900px] rounded-full bg-primary/15 blur-[120px]" />
          <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] md:w-[800px] md:h-[800px] rounded-full bg-purple-500/10 blur-[120px]" />
        </div>

        <motion.div
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="relative z-10 mx-auto max-w-[1400px] px-5 md:px-10 w-full"
        >
          <div className="flex flex-col items-center text-center">
            <motion.p
              className="text-xs md:text-sm uppercase tracking-[0.3em] text-primary font-semibold mb-6 md:mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Propostas profissionais em segundos
            </motion.p>

            <motion.h1
              className="text-[clamp(2.8rem,8vw,8rem)] font-extrabold leading-[0.9] tracking-tight uppercase"
              style={{ fontFamily: "'Syne', sans-serif" }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <span className="block">Pare de</span>
              <span className="block bg-gradient-to-r from-primary via-rose-400 to-purple-400 bg-clip-text text-transparent">
                improvisar.
              </span>
            </motion.h1>

            <motion.p
              className="mt-6 md:mt-10 max-w-md md:max-w-lg text-base md:text-lg text-[hsl(var(--landing-muted))] leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Crie propostas em PDF com design profissional direto do celular.
              Sem planilhas. Sem templates genéricos. Sem perda de tempo.
            </motion.p>

            <motion.div
              className="mt-8 md:mt-12 flex flex-col sm:flex-row items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Button
                size="lg"
                onClick={() => navigate('/auth?tab=signup')}
                className="h-14 px-10 text-base font-bold bg-primary hover:bg-primary/90 rounded-full group"
              >
                Começar grátis
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <button
                onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm text-[hsl(var(--landing-muted))] hover:text-[hsl(var(--landing-fg))] transition-colors flex items-center gap-1 underline underline-offset-4 decoration-[hsl(var(--landing-border))] hover:decoration-[hsl(var(--landing-fg))]"
              >
                Ver como funciona
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-5 h-8 rounded-full border-2 border-[hsl(var(--landing-border))] flex items-start justify-center p-1">
            <div className="w-1 h-2 rounded-full bg-[hsl(var(--landing-muted))]" />
          </div>
        </motion.div>
      </section>

      {/* Marquee strip */}
      <div className="border-y border-[hsl(var(--landing-border))] py-5 overflow-hidden">
        <motion.div
          className="flex gap-8 md:gap-16 whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          {[...audiences, ...audiences].map((a, i) => (
            <span key={i} className="text-sm md:text-base font-medium text-[hsl(var(--landing-muted))] flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {a}
            </span>
          ))}
        </motion.div>
      </div>

      {/* How it works */}
      <section id="como-funciona" className="py-24 md:py-36">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="grid md:grid-cols-2 gap-16 md:gap-20 items-start">
            <div className="sticky top-28">
              <motion.p
                className="text-xs uppercase tracking-[0.3em] text-primary font-semibold mb-4"
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              >
                Como funciona
              </motion.p>
              <motion.h2
                className="text-3xl md:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight"
                style={{ fontFamily: "'Syne', sans-serif" }}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6 }}
              >
                Simples como
                <br />
                deveria ser.
              </motion.h2>
              <motion.p
                className="mt-6 text-[hsl(var(--landing-muted))] max-w-sm leading-relaxed"
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                viewport={{ once: true }} transition={{ delay: 0.2 }}
              >
                Três passos. Nenhuma complicação. Sua proposta profissional pronta para enviar.
              </motion.p>
            </div>

            <div className="space-y-6 md:space-y-8">
              {steps.map((s, i) => (
                <motion.div
                  key={s.num}
                  className="group relative rounded-2xl border border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-card)/0.3)] p-6 md:p-8 hover:border-primary/30 transition-all duration-500"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                >
                  <div className="flex items-start gap-5">
                    <span
                      className="text-5xl md:text-6xl font-extrabold text-primary/10 group-hover:text-primary/25 transition-colors duration-500 leading-none"
                      style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                      {s.num}
                    </span>
                    <div className="pt-2">
                      <h3 className="text-lg md:text-xl font-bold">{s.title}</h3>
                      <p className="mt-2 text-sm md:text-base text-[hsl(var(--landing-muted))]">{s.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 md:py-36 border-t border-[hsl(var(--landing-border))]">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="text-center mb-16 md:mb-24">
            <motion.p
              className="text-xs uppercase tracking-[0.3em] text-primary font-semibold mb-4"
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            >
              Recursos
            </motion.p>
            <motion.h2
              className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6 }}
            >
              Tudo que você precisa.
              <br />
              <span className="text-[hsl(var(--landing-muted))]">Nada que não precisa.</span>
            </motion.h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="group relative rounded-2xl border border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-card)/0.2)] p-6 md:p-8 hover:bg-[hsl(var(--landing-card)/0.5)] transition-all duration-500"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="flex items-start justify-between mb-4 md:mb-6">
                  <h3 className="text-base md:text-lg font-bold">{f.title}</h3>
                  <ArrowUpRight className="h-4 w-4 text-[hsl(var(--landing-muted))] group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm text-[hsl(var(--landing-muted))] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Big CTA strip */}
      <section className="relative py-24 md:py-36 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-[1400px] px-5 md:px-10 text-center">
          <motion.h2
            className="text-4xl md:text-6xl lg:text-[5.5rem] font-extrabold leading-[0.95] tracking-tight uppercase"
            style={{ fontFamily: "'Syne', sans-serif" }}
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
          >
            Sua próxima proposta
            <br />
            <span className="bg-gradient-to-r from-primary via-rose-400 to-purple-400 bg-clip-text text-transparent">
              começa aqui.
            </span>
          </motion.h2>
          <motion.div
            className="mt-10 md:mt-14"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.3 }}
          >
            <Button
              size="lg"
              onClick={() => navigate('/auth?tab=signup')}
              className="h-14 md:h-16 px-10 md:px-14 text-base md:text-lg font-bold bg-primary hover:bg-primary/90 rounded-full group"
            >
              Criar conta grátis
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 md:py-36 border-t border-[hsl(var(--landing-border))]">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="text-center mb-16 md:mb-24">
            <motion.p
              className="text-xs uppercase tracking-[0.3em] text-primary font-semibold mb-4"
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            >
              Preços
            </motion.p>
            <motion.h2
              className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6 }}
            >
              Transparente.
              <br />
              <span className="text-[hsl(var(--landing-muted))]">Sem surpresas.</span>
            </motion.h2>
          </div>

          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`relative rounded-2xl p-6 md:p-8 transition-all duration-500 ${
                  plan.highlight
                    ? 'border-2 border-primary bg-primary/5 shadow-[0_0_60px_-15px_hsl(346_100%_59%/0.3)]'
                    : 'border border-[hsl(var(--landing-border))] bg-[hsl(var(--landing-card)/0.2)] hover:border-[hsl(var(--landing-muted)/0.3)]'
                }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-6 rounded-full bg-primary px-4 py-1 text-xs font-bold text-white uppercase tracking-wider">
                    Popular
                  </span>
                )}
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--landing-muted))]">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-extrabold" style={{ fontFamily: "'Syne', sans-serif" }}>{plan.price}</span>
                  <span className="text-sm text-[hsl(var(--landing-muted))]">{plan.period}</span>
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`mt-8 w-full rounded-full h-12 font-semibold ${
                    plan.highlight
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-[hsl(var(--landing-card))] hover:bg-[hsl(var(--landing-border))] text-[hsl(var(--landing-fg))]'
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
      <footer className="border-t border-[hsl(var(--landing-border))] py-10 md:py-14">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            Proponix<span className="text-primary">.</span>
          </span>
          <div className="flex items-center gap-6 text-sm text-[hsl(var(--landing-muted))]">
            <button onClick={() => navigate('/auth')} className="hover:text-[hsl(var(--landing-fg))] transition-colors">
              Entrar
            </button>
            <button onClick={() => navigate('/auth?tab=signup')} className="hover:text-[hsl(var(--landing-fg))] transition-colors">
              Criar conta
            </button>
          </div>
          <p className="text-xs text-[hsl(var(--landing-muted))]">© {new Date().getFullYear()} Proponix. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
