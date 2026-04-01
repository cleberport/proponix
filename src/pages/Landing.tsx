import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Check, Smartphone, MessageCircle, Eye,
  Zap, FileText, Send, Star,
} from 'lucide-react';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';

import freeloxLogo from '@/assets/freelox_logo.webp';
import mobileMockup from '@/assets/mobile-mockup-hero.png';

const fade = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const Landing = () => {
  const navigate = useNavigate();
  const go = (path = '/auth?tab=signup') => navigate(path);

  return (
    <div className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-primary/30">

      {/* ─── NAV ─── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <img src={freeloxLogo} alt="Freelox" className="h-7 w-7 rounded-lg" />
            <span className="text-lg font-bold tracking-tight">Freelox</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => go('/auth')}
              className="text-white/60 hover:text-white hover:bg-white/10 text-xs font-medium rounded-full">
              Entrar
            </Button>
            <Button size="sm" onClick={() => go()}
              className="bg-primary text-white hover:bg-primary/90 rounded-full px-5 text-sm font-bold">
              Começar grátis
            </Button>
          </div>
        </div>
      </nav>

      <main>

      {/* ═══════════ SECTION 1 — HERO ═══════════ */}
      <section className="relative pt-28 pb-12 md:pt-40 md:pb-20 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Left — Copy */}
            <div className="text-center md:text-left">
              <motion.h1
                className="text-[2rem] sm:text-[2.5rem] md:text-[3.25rem] font-bold leading-[1.1] tracking-[-0.03em]"
                initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              >
                Crie e envie orçamentos profissionais{' '}
                <span className="text-primary">pelo celular.</span>
              </motion.h1>

              <motion.p
                className="mt-5 text-lg md:text-xl text-white/50 font-medium"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              >
                Em minutos, sem complicação.
              </motion.p>

              <motion.ul
                className="mt-8 space-y-3 text-left mx-auto md:mx-0 max-w-xs md:max-w-none"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              >
                {[
                  { icon: Smartphone, text: 'Funciona 100% no celular' },
                  { icon: MessageCircle, text: 'Envie por WhatsApp em segundos' },
                  { icon: Eye, text: 'Veja quando o cliente visualizar' },
                ].map(item => (
                  <li key={item.text} className="flex items-center gap-3 text-[15px] text-white/60">
                    <item.icon className="h-4 w-4 shrink-0 text-primary" />
                    {item.text}
                  </li>
                ))}
              </motion.ul>

              <motion.div
                className="mt-10 flex flex-col sm:flex-row items-center md:items-start gap-3"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              >
                <Button size="lg" onClick={() => go()}
                  className="h-14 w-full sm:w-auto px-10 text-base font-semibold rounded-full bg-primary text-white hover:bg-primary/90 shadow-[0_0_40px_-8px_hsl(346_100%_59%/0.5)] group">
                  Começar grátis
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </motion.div>
            </div>

            {/* Right — Mobile Mockup */}
            <motion.div
              className="flex justify-center md:justify-end"
              initial={{ opacity: 0, y: 40, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              <img
                src={mobileMockup}
                alt="Freelox — Crie orçamentos pelo celular"
                width={800}
                height={1024}
                fetchPriority="high"
                decoding="sync"
                className="w-[280px] sm:w-[320px] md:w-[380px] drop-shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ SECTION 2 — PROBLEM + SOLUTION ═══════════ */}
      <section className="py-16 md:py-24 border-t border-white/[0.06]">
        <div className="mx-auto max-w-3xl px-5">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-center md:text-left">
              Chega de orçamentos complicados.
            </h2>
            <p className="mt-6 text-white/50 text-base md:text-lg leading-relaxed">
              Pare de perder tempo com Word, planilhas ou PDFs bagunçados.
            </p>
            <p className="mt-2 text-white/50 text-base md:text-lg leading-relaxed">
              Com o Freelox, você cria e envia seus orçamentos <span className="text-white font-medium">em minutos.</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ SECTION 3 — HOW IT WORKS ═══════════ */}
      <section className="py-16 md:py-24 border-t border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto max-w-4xl px-5">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Simples como deveria ser.</h2>
          </motion.div>

          <motion.div
            className="grid gap-6 md:grid-cols-3"
            initial="hidden" whileInView="show" viewport={{ once: true }}
            transition={{ staggerChildren: 0.12 }}
          >
            {[
              { num: '1', icon: FileText, title: 'Crie seu modelo', desc: 'Suba seu orçamento atual ou comece do zero.' },
              { num: '2', icon: Zap, title: 'Preencha em segundos', desc: 'Dados do cliente e valores — sem retrabalho.' },
              { num: '3', icon: Send, title: 'Envie e acompanhe', desc: 'PDF pronto, WhatsApp direto, link rastreável.' },
            ].map(step => (
              <motion.div
                key={step.num}
                variants={fade}
                className="relative rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 backdrop-blur"
              >
                <span className="absolute -top-4 left-8 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {step.num}
                </span>
                <step.icon className="mb-5 h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ SECTION 4 — SOCIAL PROOF ═══════════ */}
      <section className="py-16 md:py-24 border-t border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-5">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Quem usa, não volta atrás.</h2>
          </motion.div>

          <motion.div
            className="grid gap-5 sm:grid-cols-2"
            initial="hidden" whileInView="show" viewport={{ once: true }}
            transition={{ staggerChildren: 0.1 }}
          >
            {[
              { quote: 'Eu levava 20 minutos pra montar um orçamento. Agora faço em menos de 2.', author: 'Produtor de eventos' },
              { quote: 'Passei a parecer muito mais profissional só mudando a forma de enviar proposta.', author: 'Freelancer audiovisual' },
              { quote: 'O cliente respondeu na hora depois que mandei pelo Freelox.', author: 'DJ' },
              { quote: 'Simplesmente funciona. Sem enrolação.', author: 'Fotógrafo' },
            ].map((t, i) => (
              <motion.div
                key={i}
                variants={fade}
                custom={i}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-7 backdrop-blur"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-[15px] text-white/70 leading-relaxed italic">"{t.quote}"</p>
                <p className="mt-4 text-xs font-semibold text-white/40">— {t.author}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ SECTION 5 — PRICING + CTA ═══════════ */}
      <section className="py-16 md:py-24 border-t border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto max-w-5xl px-5">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Escolha como quer usar o Freelox</h2>
          </motion.div>

          <motion.div className="grid gap-5 md:grid-cols-3" initial="hidden" whileInView="show" viewport={{ once: true }}>
            {/* FREE */}
            <motion.div variants={fade} custom={0}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 flex flex-col">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Free</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-white">R$0</span>
              </div>
              <p className="text-xs text-white/40 mb-6">30 dias</p>
              <ul className="space-y-3 flex-1">
                {['1 template', 'Envio por WhatsApp', 'Marca d\'água'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/50">
                    <Check className="h-4 w-4 shrink-0 text-white/40" /> {f}
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="lg" onClick={() => go()}
                className="mt-8 w-full h-12 rounded-full border-white/10 text-white/70 hover:text-white hover:border-white/20 text-sm font-semibold">
                Começar grátis
              </Button>
            </motion.div>

            {/* PRO */}
            <motion.div variants={fade} custom={1}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 flex flex-col">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Pro</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-white">R$19,90</span>
                <span className="text-white/50 text-base">/mês</span>
              </div>
              <p className="text-xs text-white/40 mb-6">&nbsp;</p>
              <ul className="space-y-3 flex-1">
                {['Templates ilimitados', 'Sem marca d\'água', 'Envie por WhatsApp ou PDF'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/60">
                    <Check className="h-4 w-4 shrink-0 text-primary/70" /> {f}
                  </li>
                ))}
              </ul>
              <Button size="lg" onClick={() => go()}
                className="mt-8 w-full h-12 rounded-full bg-white/10 text-white hover:bg-white/15 text-sm font-semibold">
                Assinar Pro
              </Button>
            </motion.div>

            {/* PREMIUM — highlighted */}
            <motion.div variants={fade} custom={2}
              className="rounded-2xl border-2 border-primary/40 bg-primary/[0.05] p-8 flex flex-col relative shadow-[0_0_60px_-12px_hsl(346_100%_59%/0.2)]">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-5 py-1.5 text-[11px] font-bold text-white tracking-wide uppercase">
                Mais popular
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-2">Premium</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-white">R$59,90</span>
                <span className="text-white/50 text-base">/mês</span>
              </div>
              <p className="text-xs text-white/50 mb-6">ou R$599/ano</p>
              <ul className="space-y-3 flex-1">
                {[
                  'Tudo liberado',
                  'Envio por WhatsApp e PDF',
                  'Links compartilháveis',
                  'Controle completo de propostas',
                  'Automações',
                ].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/70">
                    <Check className="h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Button size="lg" onClick={() => go()}
                className="mt-8 w-full h-12 rounded-full bg-primary text-white hover:bg-primary/90 text-sm font-semibold shadow-[0_0_40px_-8px_hsl(346_100%_59%/0.4)] group">
                Assinar Premium
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-16 md:py-24 border-t border-white/[0.06]">
        <div className="relative mx-auto max-w-3xl px-5 text-center overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[500px] rounded-full bg-primary/8 blur-[100px]" />
          </div>
          <motion.div className="relative" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight">
              Pronto para fechar mais trabalhos?
            </h2>
            <Button size="lg" onClick={() => go()}
              className="mt-10 h-14 px-10 text-base font-semibold rounded-full bg-primary text-white hover:bg-primary/90 shadow-[0_0_40px_-8px_hsl(346_100%_59%/0.5)] group">
              Criar meu primeiro orçamento
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto max-w-6xl px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={freeloxLogo} alt="Freelox" className="h-6 w-6 rounded-md" />
            <span className="text-sm font-semibold">Freelox</span>
          </div>
          <p className="text-xs text-white/40">© {new Date().getFullYear()} Freelox. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
