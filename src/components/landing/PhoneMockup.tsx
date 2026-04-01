import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, FileText, Eye, Check, Link2, Copy, MessageCircle, Download, ChevronRight, Wifi, Battery, Signal } from 'lucide-react';

const screens = ['create', 'link', 'preview'] as const;
type Screen = typeof screens[number];

/* ── Fake status bar ── */
const StatusBar = () => (
  <div className="flex items-center justify-between px-5 pt-2.5 pb-1 text-[10px] font-semibold text-white/80">
    <span>9:41</span>
    <div className="flex items-center gap-1">
      <Signal className="h-3 w-3" />
      <Wifi className="h-3 w-3" />
      <Battery className="h-3.5 w-3.5" />
    </div>
  </div>
);

/* ── Screen 1: Proposal creation ── */
const CreateScreen = () => (
  <div className="flex flex-col h-full bg-[#0a0a0c]">
    <StatusBar />
    {/* Header */}
    <div className="px-4 py-3 border-b border-white/[0.06]">
      <p className="text-[11px] text-white/40 font-medium">Novo orçamento</p>
      <p className="text-sm font-bold text-white mt-0.5">Proposta #047</p>
    </div>

    {/* Form fields */}
    <div className="flex-1 px-4 py-3 space-y-2.5 overflow-hidden">
      <Field label="Cliente" value="Maria Silva" />
      <Field label="Evento" value="Casamento - Fazenda Sol" />
      <Field label="Data" value="15/03/2026" />
      <Field label="Pacote" value="Premium Completo" />

      {/* Services */}
      <div className="mt-1">
        <p className="text-[9px] uppercase tracking-wider text-white/30 font-semibold mb-1.5">Serviços</p>
        <div className="space-y-1.5">
          <ServiceRow name="Cobertura fotográfica" price="R$ 3.500" />
          <ServiceRow name="Álbum 30x30" price="R$ 1.200" />
          <ServiceRow name="Edição premium" price="R$ 800" />
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
        <span className="text-[11px] font-semibold text-white/50">Total</span>
        <span className="text-lg font-bold text-white">R$ 5.500,00</span>
      </div>
    </div>

    {/* Bottom actions */}
    <div className="px-4 py-3 border-t border-white/[0.06] space-y-2">
      <button className="w-full h-9 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-1.5">
        <Send className="h-3 w-3" /> Gerar proposta
      </button>
      <div className="flex gap-2">
        <button className="flex-1 h-8 rounded-lg bg-white/[0.06] text-white/60 text-[10px] font-medium flex items-center justify-center gap-1">
          <Eye className="h-3 w-3" /> Prévia
        </button>
        <button className="flex-1 h-8 rounded-lg bg-white/[0.06] text-white/60 text-[10px] font-medium flex items-center justify-center gap-1">
          <FileText className="h-3 w-3" /> PDF
        </button>
      </div>
    </div>
  </div>
);

/* ── Screen 2: Link generated modal ── */
const LinkScreen = () => (
  <div className="flex flex-col h-full bg-[#0a0a0c]">
    <StatusBar />
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      {/* Success check */}
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
        className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4"
      >
        <Check className="h-7 w-7 text-emerald-400" />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="text-base font-bold text-white text-center"
      >
        Proposta pronta!
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="text-[11px] text-white/40 mt-1 text-center"
      >
        Maria Silva · R$ 5.500,00
      </motion.p>

      {/* Link box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="w-full mt-6 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3"
      >
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-[10px] text-white/50 truncate">freelox.app/p/a3k9x...</span>
          <button className="ml-auto shrink-0 h-6 px-2 rounded-md bg-white/[0.08] text-[9px] text-white/60 font-medium flex items-center gap-1">
            <Copy className="h-2.5 w-2.5" /> Copiar
          </button>
        </div>

        <div className="space-y-2">
          <button className="w-full h-9 rounded-xl bg-[#25D366] text-white text-xs font-bold flex items-center justify-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" /> Enviar por WhatsApp
          </button>
          <button className="w-full h-8 rounded-lg bg-white/[0.06] text-white/60 text-[10px] font-medium flex items-center justify-center gap-1">
            <Download className="h-3 w-3" /> Baixar PDF
          </button>
        </div>
      </motion.div>

      {/* Tracking hint */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex items-center gap-1.5 mt-4"
      >
        <Eye className="h-3 w-3 text-primary/60" />
        <span className="text-[9px] text-white/30">Você será notificado quando o cliente visualizar</span>
      </motion.div>
    </div>
  </div>
);

/* ── Screen 3: Proposal preview (client view) ── */
const PreviewScreen = () => (
  <div className="flex flex-col h-full bg-[#0a0a0c]">
    <StatusBar />
    {/* Header */}
    <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
      <div>
        <p className="text-[10px] text-white/30 font-medium">Proposta para</p>
        <p className="text-sm font-bold text-white">Maria Silva</p>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[9px] text-emerald-400 font-semibold">Visualizada</span>
      </div>
    </div>

    {/* Document preview card */}
    <div className="flex-1 px-4 py-3 overflow-hidden">
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        {/* Mini doc header */}
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <div className="w-16 h-4 rounded bg-white/10 mb-1.5" />
              <p className="text-[10px] text-white/30">Casamento - Fazenda Sol</p>
            </div>
            <p className="text-lg font-bold text-white">R$ 5.500</p>
          </div>
        </div>

        {/* Mini services */}
        <div className="px-4 py-2.5 space-y-2">
          <MiniService name="Cobertura fotográfica" price="3.500" />
          <MiniService name="Álbum 30x30" price="1.200" />
          <MiniService name="Edição premium" price="800" />
        </div>

        {/* Validity */}
        <div className="px-4 py-2 border-t border-white/[0.06]">
          <p className="text-[9px] text-white/25">Válido até 30/03/2026</p>
        </div>
      </div>

      {/* Action buttons (client-side) */}
      <div className="mt-3 space-y-2">
        <button className="w-full h-9 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-1.5">
          <Check className="h-3 w-3" /> Aprovar proposta
        </button>
        <button className="w-full h-8 rounded-lg bg-white/[0.06] text-white/50 text-[10px] font-medium flex items-center justify-center gap-1">
          Solicitar alterações <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  </div>
);

/* ── Reusable bits ── */
const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
    <p className="text-[9px] text-white/30 font-medium mb-0.5">{label}</p>
    <p className="text-[12px] text-white font-medium">{value}</p>
  </div>
);

const ServiceRow = ({ name, price }: { name: string; price: string }) => (
  <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
    <span className="text-[11px] text-white/70">{name}</span>
    <span className="text-[11px] font-semibold text-white">{price}</span>
  </div>
);

const MiniService = ({ name, price }: { name: string; price: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-[10px] text-white/50">{name}</span>
    <span className="text-[10px] text-white/70 font-medium">R$ {price}</span>
  </div>
);

/* ── Indicator dots ── */
const Dots = ({ active }: { active: number }) => (
  <div className="flex items-center justify-center gap-1.5 py-2">
    {screens.map((_, i) => (
      <button
        key={i}
        className={`h-1.5 rounded-full transition-all duration-300 ${
          i === active ? 'w-4 bg-primary' : 'w-1.5 bg-white/20'
        }`}
      />
    ))}
  </div>
);

/* ══════════ MAIN COMPONENT ══════════ */
const PhoneMockup = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % screens.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const screenComponents = [<CreateScreen />, <LinkScreen />, <PreviewScreen />];

  return (
    <div className="relative">
      {/* Phone frame */}
      <div
        className="relative rounded-[2.5rem] border-[3px] border-white/[0.12] bg-[#0a0a0c] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
        style={{ width: '100%', aspectRatio: '9 / 18.5' }}
      >
        {/* Notch / Dynamic Island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[72px] h-[22px] rounded-full bg-black z-20" />

        {/* Screen content */}
        <div className="relative w-full h-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              {screenComponents[current]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom bar (home indicator) */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[100px] h-[4px] rounded-full bg-white/20 z-20" />
      </div>

      {/* Dots indicator below phone */}
      <Dots active={current} />
    </div>
  );
};

export default PhoneMockup;
