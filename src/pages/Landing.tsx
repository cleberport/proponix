import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Check, Upload, Sparkles, Pencil, FileOutput,
  Zap, ChevronDown, X,
  Download, MessageCircle, Link2, Eye, RefreshCw, ThumbsUp,
} from 'lucide-react';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import { useState } from 'react';

import heroMockup from '@/assets/mockup-hero.jpg';
import editorMockup from '@/assets/mockup-editor.jpg';
import generateMockup from '@/assets/mockup-generate.jpg';

/* ── animation helpers ── */
const fade = {
  hidden: { opacity: 0, y: 32 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

/* ── reusable atoms ── */
const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/60 backdrop-blur">
    {children}
  </span>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">{children}</p>
);

/* ── step card ── */
const StepCard = ({ num, icon: Icon, title, desc }: { num: string; icon: React.ElementType; title: string; desc: string }) => (
  <motion.div
    className="relative flex flex-col items-start rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 backdrop-blur"
    variants={fade}
  >
    <span className="absolute -top-4 left-8 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
      {num}
    </span>
    <Icon className="mb-5 h-6 w-6 text-primary" />
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    <p className="mt-2 text-sm leading-relaxed text-white/50">{desc}</p>
  </motion.div>
);

/* ── bullet list ── */
const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3 text-white/60 text-[15px] leading-relaxed">
    <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
    {children}
  </li>
);

/* ── FAQ item ── */
const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left text-[15px] font-medium text-white"
      >
        {q}
        <ChevronDown className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-40 pb-5' : 'max-h-0'}`}>
        <p className="text-sm text-white/50 leading-relaxed">{a}</p>
      </div>
    </div>
  );
};

/* ═══════════════ MAIN PAGE ═══════════════ */
const Landing = () => {
  const navigate = useNavigate();
  const go = (path = '/auth?tab=signup') => navigate(path);

  

  return (
    <div className="min-h-screen bg-[#09090b] text-white antialiased selection:bg-primary/30">

      {/* ─── NAV ─── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Freelox</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[13px] text-white/50 font-medium">
            <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
            <a href="#beneficios" className="hover:text-white transition-colors">Benefícios</a>
            <a href="#pricing" className="hover:text-white transition-colors">Preços</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => go('/auth')}
              className="text-white/60 hover:text-white hover:bg-white/10 text-xs font-medium rounded-full">
              Entrar
            </Button>
            <Button size="sm" onClick={() => go()}
              className="bg-primary text-white hover:bg-primary/90 rounded-full px-5 text-xs font-semibold">
              Começar grátis
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-36 pb-16 md:pt-48 md:pb-24 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-5 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Importação inteligente com IA</Badge>
          </motion.div>

          <motion.h1
            className="mt-8 text-[2.25rem] sm:text-[3rem] md:text-[3.75rem] font-bold leading-[1.08] tracking-[-0.03em]"
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          >
            Seu orçamento pronto em segundos,{' '}
            <span className="text-primary">no seu próprio layout.</span>
          </motion.h1>

          <motion.p
            className="mt-6 mx-auto max-w-2xl text-base md:text-lg leading-relaxed text-white/50"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          >
            Suba o modelo que você já usa, ajuste uma vez e gere novos PDFs automaticamente.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          >
            <Button size="lg" onClick={() => go()}
              className="h-14 w-full sm:w-auto px-10 text-base font-semibold rounded-full bg-primary text-white hover:bg-primary/90 shadow-[0_0_40px_-8px_hsl(346_100%_59%/0.5)] group">
              Criar orçamento grátis
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>

          <motion.p
            className="mt-5 text-sm text-white/30"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          >
            Sem retrabalho. Sem complicação.
          </motion.p>

          {/* ─── PRODUCT MOCKUP ─── */}
          <motion.div
            className="mt-16 mx-auto max-w-3xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7 }}
          >
            <img
              src={heroMockup}
              alt="Freelox — Dashboard com templates de orçamento"
              width={1920}
              height={1080}
              className="rounded-2xl border border-white/[0.08] shadow-2xl shadow-primary/10"
            />
          </motion.div>
        </div>
      </section>

      {/* ─── TRUST LINE ─── */}
      <section className="border-y border-white/[0.06] py-6">
        <p className="text-center text-sm text-white/40 px-5">
          Use o orçamento que você já tem. Feito para quem precisa criar e enviar com rapidez.
        </p>
      </section>

      {/* ─── ANTES VS DEPOIS ─── */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-5">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
            <SectionLabel>Comparação</SectionLabel>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Antes vs depois do Freelox</h2>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-6"
            initial="hidden" whileInView="show" viewport={{ once: true }}
            transition={{ staggerChildren: 0.12 }}
          >
            {/* Antes */}
            <motion.div variants={fade} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                  <X className="h-4 w-4 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white/70">Antes</h3>
              </div>
              <ul className="space-y-3">
                {['Abrir arquivo antigo', 'Editar manualmente', 'Ajustar layout', 'Exportar PDF', 'Enviar'].map(t => (
                  <li key={t} className="flex items-center gap-3 text-[15px] text-white/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/20 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-white/25">~30 minutos por orçamento</p>
            </motion.div>

            {/* Depois */}
            <motion.div variants={fade} className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-white">Depois</h3>
              </div>
              <ul className="space-y-3">
                {['Preencher', 'Gerar', 'Enviar'].map(t => (
                  <li key={t} className="flex items-center gap-3 text-[15px] text-white/70">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-primary/60 font-medium">~2 minutos por orçamento</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── COMO FUNCIONA ─── */}
      <section id="como-funciona" className="py-20 md:py-28 border-t border-white/[0.06]">
        <div className="mx-auto max-w-5xl px-5">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade} custom={0}>
            <SectionLabel>Passo a passo</SectionLabel>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Como funciona</h2>
          </motion.div>

          <motion.div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
            initial="hidden" whileInView="show" viewport={{ once: true }}
            transition={{ staggerChildren: 0.1 }}
          >
            <StepCard num="1" icon={Upload} title="Suba seu orçamento" desc="PDF ou imagem do modelo que você já usa." />
            <StepCard num="2" icon={Sparkles} title="A IA organiza" desc="O Freelox recria o layout como template editável." />
            <StepCard num="3" icon={Pencil} title="Ajuste rapidamente" desc="Revise textos, campos, valores e logo." />
            <StepCard num="4" icon={FileOutput} title="Gere e envie" desc="Preencha o necessário e exporte o PDF." />
          </motion.div>
        </div>
      </section>

      {/* ─── IA SECTION (SIMPLIFIED) ─── */}
      <section className="py-20 md:py-28 border-t border-white/[0.06]">
        <div className="mx-auto max-w-3xl px-5">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
            <SectionLabel>Inteligência artificial</SectionLabel>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
              A IA organiza.{' '}
              <span className="text-primary">Você ajusta uma vez.</span>
            </h2>
            <p className="mt-6 text-white/50 leading-relaxed max-w-xl">
              O Freelox recria seu orçamento automaticamente.
            </p>
            <p className="mt-3 text-white/50 leading-relaxed max-w-xl">
              Você revisa, ajusta e pronto — seu modelo fica pronto para uso ilimitado.
            </p>
            <p className="mt-8 text-sm font-medium text-primary/80">
              Use o orçamento que você já tem.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── ENVIE COMO QUISER ─── */}
      <section className="py-20 md:py-28 border-t border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto max-w-4xl px-5">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
            <SectionLabel>Entrega</SectionLabel>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Envie como quiser</h2>
            <p className="mt-4 text-white/50 max-w-xl">
              Depois de gerar o orçamento, você pode:
            </p>

            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              {[
                { icon: Download, label: 'Baixar o PDF' },
                { icon: MessageCircle, label: 'Enviar pelo WhatsApp' },
                { icon: Link2, label: 'Compartilhar por link' },
              ].map(item => (
                <div key={item.label}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 transition-colors hover:border-primary/20">
                  <item.icon className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-[15px] text-white/70">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Sub: Mais controle */}
          <motion.div className="mt-14" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
            <h3 className="text-lg md:text-xl font-semibold text-white/90">Mais controle, se você quiser</h3>
            <ul className="mt-5 space-y-3">
              {[
                { icon: Eye, text: 'Veja quando o cliente visualizou' },
                { icon: RefreshCw, text: 'Reenvie o orçamento em segundos' },
                { icon: ThumbsUp, text: 'Receba uma aprovação simples (opcional)' },
              ].map(item => (
                <li key={item.text} className="flex items-center gap-3 text-[15px] text-white/55">
                  <item.icon className="h-4 w-4 shrink-0 text-primary/70" />
                  {item.text}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-white/35">Tudo isso sem complicar o seu fluxo.</p>
          </motion.div>
        </div>
      </section>

      {/* ─── VALUE ─── */}
      <section className="py-20 md:py-28 border-t border-white/[0.06]">
        <div className="mx-auto max-w-3xl px-5">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
            <SectionLabel>Produtividade</SectionLabel>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
              Pare de refazer o mesmo orçamento toda vez
            </h2>
            <ul className="mt-8 space-y-3">
              <Bullet>Use o orçamento que você já tem</Bullet>
              <Bullet>Nada de abrir Word ou Canva</Bullet>
              <Bullet>Nada de copiar e colar</Bullet>
              <Bullet>Tudo pronto para reutilizar</Bullet>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ─── ALTERNATIVE ─── */}
      <section className="py-20 md:py-28 border-t border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
            <SectionLabel>Templates</SectionLabel>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Ou comece com modelos prontos</h2>
            <p className="mt-4 text-white/50 max-w-lg mx-auto">
              Se preferir, use templates prontos e personalize do seu jeito.
            </p>
            <motion.div
              className="mt-10 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
              initial="hidden" whileInView="show" viewport={{ once: true }}
              transition={{ staggerChildren: 0.15 }}
            >
              <motion.img
                variants={fade}
                src={editorMockup}
                alt="Freelox — Editor de templates"
                width={1920}
                height={1080}
                loading="lazy"
                className="rounded-xl border border-white/[0.08] shadow-xl"
              />
              <motion.img
                variants={fade}
                src={generateMockup}
                alt="Freelox — Geração de PDF"
                width={1920}
                height={1080}
                loading="lazy"
                className="rounded-xl border border-white/[0.08] shadow-xl"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── BENEFITS ─── */}
      <section id="beneficios" className="py-20 md:py-28 border-t border-white/[0.06]">
        <div className="mx-auto max-w-3xl px-5">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
            <SectionLabel>Benefícios</SectionLabel>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Mais velocidade, menos esforço</h2>
            <ul className="mt-8 space-y-3">
              <Bullet>Crie orçamentos em segundos</Bullet>
              <Bullet>Evite erros</Bullet>
              <Bullet>Padronize seu trabalho</Bullet>
              <Bullet>Ganhe tempo no dia a dia</Bullet>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ─── SPEED STATEMENT ─── */}
      <section className="border-y border-white/[0.06] py-14 md:py-18">
        <motion.p
          className="text-center text-xl md:text-3xl font-bold tracking-tight text-white/80 px-5"
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
        >
          Do modelo ao PDF pronto em poucos cliques.
        </motion.p>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-5">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
            <SectionLabel>Preços</SectionLabel>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Escolha o plano ideal</h2>
            <p className="mt-3 text-sm text-white/40">Comece grátis. Evolua quando precisar.</p>
          </motion.div>

          <motion.div className="grid gap-5 md:grid-cols-3" initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}>
            {/* FREE */}
            <motion.div variants={fade} custom={0}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 backdrop-blur flex flex-col">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Free</p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-white">R$0</span>
              </div>
              <ul className="mt-4 space-y-3 flex-1">
                {['1 template', 'Geração de PDF', 'WhatsApp sharing', 'Marca d\'água nos modelos', 'Trial de 30 dias'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/50">
                    <Check className="h-4 w-4 shrink-0 text-white/30" /> {f}
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
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 backdrop-blur flex flex-col">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Pro</p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-white">R$19,90</span>
                <span className="text-white/40 text-lg">/mês</span>
              </div>
              <ul className="mt-4 space-y-3 flex-1">
                {['Templates ilimitados', 'Sem marca d\'água', 'Geração ilimitada de PDF', 'WhatsApp sharing', 'Upload de modelos'].map(f => (
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

            {/* PREMIUM */}
            <motion.div variants={fade} custom={2}
              className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-8 backdrop-blur flex flex-col relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[11px] font-semibold text-white">
                Mais popular
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary/70 mb-2">Premium</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-white">R$59,90</span>
                <span className="text-white/40 text-lg">/mês</span>
              </div>
              <p className="text-xs text-white/30 mb-4">ou R$599/ano (2 meses grátis)</p>
              <ul className="mt-4 space-y-3 flex-1">
                {[
                  'Tudo do Pro',
                  'Envio por link',
                  'WhatsApp + link tracking',
                  'Documentos e rastreio',
                  'Propostas recebidas',
                  'Módulo financeiro',
                  'Automações e e-mails',
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

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 md:py-28 border-t border-white/[0.06]">
        <div className="mx-auto max-w-2xl px-5">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
            <SectionLabel>Dúvidas</SectionLabel>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Perguntas frequentes</h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
            <FaqItem q="O plano Free é gratuito?" a="Sim, por 30 dias. Você pode gerar PDF e enviar pelo WhatsApp. Após o trial, é necessário assinar um plano." />
            <FaqItem q="Funciona no celular?" a="Sim. O Freelox foi feito para uso rápido em qualquer dispositivo." />
            <FaqItem q="Preciso saber design?" a="Não. Use o orçamento que você já tem. A IA organiza tudo." />
            <FaqItem q="Posso enviar por WhatsApp?" a="Sim! Em todos os planos você pode gerar o PDF e compartilhar via WhatsApp. Links rastreáveis são exclusivos do Premium." />
            <FaqItem q="Qual a diferença entre Pro e Premium?" a="O Pro inclui templates ilimitados e sem marca d'água. O Premium adiciona envio por link rastreável, módulo de documentos, propostas recebidas, financeiro e automações." />
          </motion.div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-20 md:py-28 border-t border-white/[0.06]">
        <div className="relative mx-auto max-w-3xl px-5 text-center overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px] rounded-full bg-primary/8 blur-[100px]" />
          </div>
          <motion.div className="relative" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight">
              Seu orçamento já existe.{' '}
              <span className="text-primary">Só falta automatizar.</span>
            </h2>
            <p className="mt-4 text-white/40 text-sm">
              Use o orçamento que você já tem.
            </p>
            <Button size="lg" onClick={() => go()}
              className="mt-10 h-14 px-10 text-base font-semibold rounded-full bg-primary text-white hover:bg-primary/90 shadow-[0_0_40px_-8px_hsl(346_100%_59%/0.5)] group">
              Criar meu orçamento agora
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/[0.06] py-10">
        <div className="mx-auto max-w-6xl px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">Freelox</span>
          </div>
          <p className="text-xs text-white/30">© {new Date().getFullYear()} Freelox. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
