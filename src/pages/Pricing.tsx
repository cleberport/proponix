import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Smartphone, Zap, ShieldCheck, ChevronDown } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';

const fade = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const Pricing = () => {
  const navigate = useNavigate();
  const go = () => navigate('/auth?tab=signup');

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-neutral-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <button onClick={() => navigate('/')} className="text-lg font-bold tracking-tight">Freelox</button>
          <Button size="sm" onClick={go}>Criar conta</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-5 pt-16 pb-12 text-center md:pt-24 md:pb-16">
        <motion.h1
          className="text-[1.75rem] font-bold leading-[1.15] tracking-tight md:text-[2.75rem]"
          initial="hidden" animate="visible" variants={fade} custom={0}
        >
          Pare de perder clientes<br className="hidden md:block" /> por demora no orçamento.
        </motion.h1>
        <motion.p
          className="mx-auto mt-4 max-w-lg text-base text-neutral-500 md:text-lg"
          initial="hidden" animate="visible" variants={fade} custom={1}
        >
          Crie, envie e tenha propostas aprovadas em minutos — direto do celular.
        </motion.p>
        <motion.p
          className="mt-3 text-sm text-neutral-400"
          initial="hidden" animate="visible" variants={fade} custom={2}
        >
          Mais rápido que planilha. Mais profissional que PDF manual.
        </motion.p>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-5xl px-5 pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {/* Free */}
          <motion.div
            className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 md:p-8"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0}
          >
            <p className="text-sm font-medium text-neutral-400 uppercase tracking-wide">Teste grátis</p>
            <h3 className="mt-3 text-xl font-bold">Teste grátis por 30 dias</h3>
            <p className="mt-2 text-sm text-neutral-500"><p className="mt-2 text-sm text-neutral-500">Acesso completo ao Freelox durante o período de teste.</p></p>
            <ul className="mt-6 flex-1 space-y-3">
              <Feature>Todos os recursos liberados</Feature>
              <Feature>Sem limitações durante o teste</Feature>
            </ul>
            <Button variant="outline" className="mt-8 h-12 w-full rounded-xl text-sm font-semibold" onClick={go}>
              Começar grátis
            </Button>
          </motion.div>

          {/* Pro */}
          <motion.div
            className="relative flex flex-col rounded-2xl border-2 border-primary bg-white p-6 shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.18)] md:p-8"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={1}
          >
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground uppercase tracking-wide">
              Mais escolhido
            </span>
            <p className="text-sm font-medium text-primary uppercase tracking-wide">Pro</p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-bold">R$19</span>
              <span className="text-sm text-neutral-400">/mês</span>
            </div>
            <p className="mt-1 text-xs text-neutral-400">ou <span className="font-medium text-neutral-600">R$197/ano</span> (2 meses grátis)</p>
            <ul className="mt-6 flex-1 space-y-3">
              <Feature>Templates ilimitados</Feature>
              <Feature>Biblioteca de serviços</Feature>
              <Feature>Geração de PDF profissional</Feature>
              <Feature>Envio por link com aprovação</Feature>
              <Feature>Reenvio de propostas</Feature>
              <Feature>Histórico completo</Feature>
              <Feature>Sem marca d'água</Feature>
            </ul>
            <div className="mt-8 flex flex-col gap-2">
              <Button className="h-12 w-full rounded-xl text-sm font-semibold" onClick={go}>
                Assinar mensal — R$19/mês <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button variant="outline" className="h-12 w-full rounded-xl text-sm font-semibold" onClick={go}>
                Assinar anual — R$197/ano
              </Button>
            </div>
          </motion.div>

          {/* Lifetime */}
          <motion.div
            className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 md:p-8"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={2}
          >
            <p className="text-sm font-medium text-neutral-400 uppercase tracking-wide">Vitalício</p>
            <h3 className="mt-3 text-xl font-bold">Plano vitalício</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold">R$397</span>
              <span className="text-sm text-neutral-400">pagamento único</span>
            </div>
            <ul className="mt-6 flex-1 space-y-3">
              <Feature>Tudo do plano Pro</Feature>
              <Feature>Acesso para sempre</Feature>
              <Feature>Sem mensalidade</Feature>
            </ul>
            <p className="mt-4 text-center text-sm font-medium text-orange-600">🔥 Oferta limitada para primeiros usuários</p>
            <Button variant="outline" className="mt-4 h-12 w-full rounded-xl text-sm font-semibold" onClick={go}>
              Garantir acesso vitalício
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Value */}
      <SectionBlock>
        <motion.p
          className="mx-auto max-w-xl text-center text-lg font-semibold leading-snug md:text-2xl"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0}
        >
          Se o Freelox te ajudar a fechar apenas <span className="text-primary">1 cliente a mais</span>, ele já se paga no primeiro uso. a fechar apenas <span className="text-primary">1 cliente a mais</span>, ele já se paga no primeiro uso.
        </motion.p>
      </SectionBlock>

      {/* Speed */}
      <SectionBlock className="bg-neutral-50">
        <motion.div
          className="mx-auto max-w-lg text-center"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0}
        >
          <Zap className="mx-auto mb-4 h-8 w-8 text-primary" />
          <h2 className="text-xl font-bold md:text-2xl">Crie um orçamento em menos de 30 segundos.</h2>
          <div className="mt-6 flex flex-col gap-2 text-sm text-neutral-500">
            <span>✕ Sem planilhas</span>
            <span>✕ Sem retrabalho</span>
            <span>✕ Sem complicação</span>
          </div>
        </motion.div>
      </SectionBlock>

      {/* Mobile */}
      <SectionBlock>
        <motion.div
          className="mx-auto max-w-lg text-center"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0}
        >
          <Smartphone className="mx-auto mb-4 h-8 w-8 text-primary" />
          <h2 className="text-xl font-bold md:text-2xl">Funciona direto no celular.</h2>
          <p className="mt-3 text-neutral-500">Crie, envie e compartilhe no WhatsApp em segundos.</p>
        </motion.div>
      </SectionBlock>

      {/* Trust */}
      <SectionBlock className="bg-neutral-50">
        <motion.div
          className="mx-auto flex max-w-md items-center justify-center gap-3 text-center"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0}
        >
          <ShieldCheck className="h-6 w-6 shrink-0 text-primary" />
          <p className="text-base font-medium md:text-lg">Sem compromisso. Cancele quando quiser.</p>
        </motion.div>
      </SectionBlock>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl px-5 py-16 md:py-24">
        <motion.h2
          className="mb-8 text-center text-xl font-bold md:text-2xl"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0}
        >
          Perguntas frequentes
        </motion.h2>
        <Accordion type="single" collapsible className="space-y-2">
          <FaqItem value="1" q="Preciso cadastrar cartão?" a="Não. Você pode testar gratuitamente por 30 dias." />
          <FaqItem value="2" q="Posso cancelar quando quiser?" a="Sim. Sem burocracia." />
          <FaqItem value="3" q="O plano vitalício é realmente para sempre?" a="Sim. Você paga uma vez e usa o Freelox sem mensalidade." />
          <FaqItem value="4" q="Funciona no celular?" a="Sim. O Freelox foi pensado para uso rápido no celular." />
        </Accordion>
      </section>

      {/* Final CTA */}
      <section className="border-t border-neutral-100 bg-neutral-50">
        <div className="mx-auto max-w-xl px-5 py-16 text-center md:py-24">
          <motion.h2
            className="text-xl font-bold md:text-2xl"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={0}
          >
            Comece a enviar propostas profissionais hoje.
          </motion.h2>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade} custom={1}
          >
            <Button className="mt-6 h-12 rounded-xl px-8 text-sm font-semibold" onClick={go}>
              Criar conta grátis <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

/* ---------- small helpers ---------- */

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-neutral-700">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      {children}
    </li>
  );
}

function SectionBlock({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`px-5 py-16 md:py-24 ${className}`}>{children}</section>;
}

function FaqItem({ value, q, a }: { value: string; q: string; a: string }) {
  return (
    <AccordionItem value={value} className="rounded-xl border border-neutral-200 px-5">
      <AccordionTrigger className="text-sm font-medium hover:no-underline">{q}</AccordionTrigger>
      <AccordionContent className="text-sm text-neutral-500">{a}</AccordionContent>
    </AccordionItem>
  );
}

export default Pricing;
