import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { generatePdfFromDom } from '@/lib/pdfGenerator';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle, FileText, Loader2, AlertCircle, Eye, Clock,
  MessageSquare, Download, ShieldCheck,
} from 'lucide-react';
import { CanvasElement, Template } from '@/types/template';
import { starterTemplates } from '@/data/templates';
import { motion, AnimatePresence } from 'framer-motion';
import CanvasRenderer from '@/components/editor/CanvasRenderer';
import { resolveAllValues, formatCurrency } from '@/lib/calculations';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProposalData {
  id: string;
  token: string;
  status: string;
  viewedAt: string | null;
  approvedAt: string | null;
  approverName: string;
  expiresAt: string | null;
  negotiationMessage: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  senderUserId?: string;
  documentId?: string;
  document: {
    clientName: string;
    templateName: string;
    templateId: string;
    fileName: string;
    values: Record<string, any>;
    generatedAt: string;
  };
  template: {
    elements: unknown;
    settings: { taxRate?: number; showTax?: boolean; backgroundColor?: string } | null;
    canvasWidth: number;
    canvasHeight: number;
    calculatedFields?: Record<string, string>;
    defaultValues?: Record<string, string>;
  } | null;
  company: {
    name: string;
    email: string;
    phone: string;
    website: string;
    address: string;
    logoUrl: string;
  } | null;
}

type Step = 'entry' | 'viewing' | 'decision' | 'approved' | 'negotiation-sent' | 'expired';

const normalizeTemplatePages = (layout: unknown): CanvasElement[][] => {
  if (Array.isArray(layout)) {
    if (layout.length === 0) return [];
    if (Array.isArray(layout[0])) {
      return (layout as unknown[]).filter((page): page is CanvasElement[] => Array.isArray(page));
    }
    return [layout as CanvasElement[]];
  }

  if (layout && typeof layout === 'object') {
    const parsed = layout as { elements?: unknown; pages?: unknown };

    if (Array.isArray(parsed.pages)) {
      const pages = parsed.pages.filter((page): page is CanvasElement[] => Array.isArray(page));
      if (pages.length > 0) return pages;
    }

    if (Array.isArray(parsed.elements)) {
      return [parsed.elements as CanvasElement[]];
    }
  }

  return [];
};

const ProposalView = () => {
  const { token } = useParams<{ token: string }>();
  const isMobile = useIsMobile();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState('');
  const [approverName, setApproverName] = useState('');
  const [approving, setApproving] = useState(false);
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showNegotiationForm, setShowNegotiationForm] = useState(false);
  const [negotiationMessage, setNegotiationMessage] = useState('');
  const [sendingNegotiation, setSendingNegotiation] = useState(false);
  const [step, setStep] = useState<Step>('entry');
  const [markingViewed, setMarkingViewed] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const docContainerRef = useRef<HTMLDivElement | null>(null);
  const pageRefsMap = useRef<Map<number, HTMLDivElement>>(new Map());
  const NOOP = useCallback(() => undefined, []);

  // Detect if UI is in dark mode to adapt logo contrast
  // NOTE: This project inverts the theme — :root is dark, .dark class is light
  const [headerIsDark, setHeaderIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      // If .dark class is present, UI is actually LIGHT; otherwise it's dark
      if (document.documentElement.classList.contains('dark')) return false;
      return true; // :root = dark by default
    }
    return true;
  });

  useEffect(() => {
    const check = () => {
      // .dark class = light mode in this project's inverted theme
      setHeaderIsDark(!document.documentElement.classList.contains('dark'));
    };
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', check);
    return () => {
      observer.disconnect();
      mq.removeEventListener('change', check);
    };
  }, []);

  const fetchProposal = useCallback(async (markViewed = false) => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = new URL(`https://${projectId}.supabase.co/functions/v1/proposal-public`);
      url.searchParams.set('token', token!);
      if (!markViewed) url.searchParams.set('peek', '1');

      const res = await fetch(url.toString(), {
        headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data.error === 'blocked') {
          setBlocked(true);
          setBlockedMessage(data.message || 'Este orçamento já foi visualizado e não está mais disponível.');
          return;
        }
        if (res.status === 410) {
          setStep('expired');
          setError(data.message || 'Esta proposta expirou.');
          return;
        }
        throw new Error(data.error || 'Erro');
      }
      setProposal(data.proposal);

      // Determine step
      if (data.proposal.status === 'aprovado') {
        setStep('approved');
      } else if (data.proposal.status === 'negociacao') {
        setStep('negotiation-sent');
      } else if (data.proposal.expiresAt && new Date(data.proposal.expiresAt) < new Date()) {
        setStep('expired');
      } else if (markViewed || data.proposal.status === 'visualizado') {
        setStep('viewing');
      } else {
        setStep('entry');
      }
    } catch (err: any) {
      setError(err.message || 'Proposta não encontrada');
    } finally {
      setLoading(false);
      setMarkingViewed(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchProposal(false);
  }, [token, fetchProposal]);

  // Track as received for logged-in users
  useEffect(() => {
    if (!proposal) return;
    const trackReceived = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Listen for future login
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
          if (sess && proposal) {
            saveReceivedProposal(sess.user.id, proposal);
            subscription.unsubscribe();
          }
        });
        return () => subscription.unsubscribe();
      }
      // Don't track if the viewer is the sender
      // Don't track if the viewer is the sender
      if (session.user.id !== proposal.senderUserId) {
        await saveReceivedProposal(session.user.id, proposal);
      }
    };
    trackReceived();
  }, [proposal]);

  // Auto-reveal action buttons after 3s when viewing
  useEffect(() => {
    if (step !== 'viewing') return;
    const timer = setTimeout(() => setStep('decision'), 3000);
    return () => clearTimeout(timer);
  }, [step]);

  const saveReceivedProposal = async (userId: string, p: ProposalData) => {
    try {
      // Extract total value from document values
      const vals = p.document?.values as Record<string, any> || {};
      let totalValue = '';
      const totalKeys = ['total', 'valor_total', 'preco_total', 'subtotal', 'valor', 'price', 'preco'];
      for (const key of totalKeys) {
        const v = vals[key];
        if (v !== undefined && v !== null && v !== '') {
          const num = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d,.-]/g, '').replace(',', '.'));
          if (!isNaN(num) && num > 0) {
            totalValue = num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            break;
          }
        }
      }

      await supabase.from('received_proposals').upsert(
        {
          user_id: userId,
          proposal_link_id: p.id,
          document_id: p.documentId || p.id,
          sender_user_id: p.senderUserId || '',
          client_name: p.document?.clientName || '',
          template_name: p.document?.templateName || '',
          sender_name: p.company?.name || '',
          sender_company: p.company?.name || '',
          total_value: totalValue,
          status: p.status,
          last_action: p.status === 'visualizado' ? 'Visualizado' : p.status === 'aprovado' ? 'Aprovado' : p.status === 'negociacao' ? 'Negociação' : 'Recebido',
          last_action_at: new Date().toISOString(),
          received_at: new Date().toISOString(),
          token: token || '',
        } as any,
        { onConflict: 'user_id,proposal_link_id' }
      );
    } catch (err) {
      console.error('Error tracking received proposal:', err);
    }
  };

  // Measure container for document scaling
  useEffect(() => {
    const node = docContainerRef.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setContainerSize({ w: rect.width, h: rect.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [step]);

  const handleViewProposal = async () => {
    setMarkingViewed(true);
    await fetchProposal(true);
  };

  const handleApprove = async () => {
    if (!approverName.trim()) return;
    setApproving(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/proposal-public?token=${encodeURIComponent(token!)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: 'approve', approverName: approverName.trim() }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro');
      setStep('approved');
      setShowApproveForm(false);
      if (proposal) {
        setProposal({ ...proposal, status: 'aprovado', approvedAt: data.approvedAt, approverName: approverName.trim() });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleSendNegotiation = async () => {
    if (!negotiationMessage.trim()) return;
    setSendingNegotiation(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/proposal-public?token=${encodeURIComponent(token!)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: 'negotiate', message: negotiationMessage.trim() }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro');
      setStep('negotiation-sent');
      setShowNegotiationForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingNegotiation(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!hasTemplate) return;
    setDownloadingPdf(true);
    try {
      const fileName = proposal!.document.fileName;

      // Always use DOM-based capture for pixel-perfect consistency
      const pageEls = Array.from(pageRefsMap.current.entries())
        .sort(([a], [b]) => a - b)
        .map(([, el]) => el)
        .filter(Boolean);

      if (pageEls.length > 0) {
        const blob = await generatePdfFromDom(pageEls, fileName, { skipDownload: true });
        if (blob) {
          let shared = false;
          // On mobile, try native share first
          if (isMobile && navigator.share) {
            const file = new File([blob], fileName, { type: 'application/pdf' });
            try {
              if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({ files: [file], title: fileName });
                shared = true;
              }
            } catch { /* user cancelled or failed — fall through to download */ }
          }
          // Fallback: download
          if (!shared) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }
      }
    } catch {
      // silent
    } finally {
      setDownloadingPdf(false);
    }
  };

  const variableValues = useMemo(() => {
    if (!proposal) return {};

    // Start with document values
    const vals = proposal.document.values as Record<string, any>;
    const result: Record<string, string> = {};
    Object.entries(vals).forEach(([k, v]) => {
      result[k] = String(v ?? '');
    });

    // Try resolving calculated fields from the custom template (API data)
    const apiCalc = proposal.template?.calculatedFields;
    const apiDefaults = proposal.template?.defaultValues;
    if (apiCalc && Object.keys(apiCalc).length > 0) {
      // Build a pseudo-template for resolveAllValues
      const pseudoTemplate = {
        calculatedFields: apiCalc,
        defaultValues: apiDefaults || {},
      } as Template;
      const resolved = resolveAllValues(pseudoTemplate, result);
      Object.entries(resolved).forEach(([k, v]) => {
        if (!result[k] || result[k] === '') result[k] = v;
      });
    }

    // Fallback: try starter templates
    const templateId = proposal.document?.templateId;
    const starter = templateId ? starterTemplates.find(t => t.id === templateId) : null;
    if (starter) {
      const resolved = resolveAllValues(starter, result);
      Object.entries(resolved).forEach(([k, v]) => {
        if (!result[k] || result[k] === '') result[k] = v;
      });
    }

    // Format currency fields (same as Generate page)
    const currencyFields = ['price', 'subtotal', 'tax', 'total'];
    for (const f of currencyFields) {
      if (result[f] && !isNaN(parseFloat(result[f]))) {
        result[f] = formatCurrency(result[f]);
      }
    }

    // Format service price fields
    for (const [k, v] of Object.entries(result)) {
      if (/^service_\d+_price$/.test(k) && v && !isNaN(parseFloat(v))) {
        result[k] = formatCurrency(v);
      }
    }

    if (proposal.company?.logoUrl) {
      result['__logo_url__'] = proposal.company.logoUrl;
    }
    return result;
  }, [proposal]);

  const templatePages = useMemo(() => {
    // First try from API template data
    let pages = normalizeTemplatePages(proposal?.template?.elements);
    if (!pages.some(p => p.length > 0)) {
      // Fallback: try starter templates by template ID
      const templateId = proposal?.document?.templateId;
      if (templateId) {
        const starter = starterTemplates.find(t => t.id === templateId);
        if (starter) {
          if (starter.pages && starter.pages.length > 0) pages = starter.pages;
          else if (starter.elements && starter.elements.length > 0) pages = [starter.elements];
        }
      }
    }

    // Expand service blocks based on saved service count and inject tax/fee config
    const vals = (proposal?.document?.values || {}) as Record<string, any>;
    const savedCount = parseInt(vals['__service_count__'] || '0', 10);
    const savedTaxPct = parseFloat(vals['__tax_percent__'] || '0');
    const savedFeePct = parseFloat(vals['__fee_percent__'] || '0');
    const savedFeeName = vals['__fee_name__'] || 'Comissão';
    if (savedCount > 0) {
      pages = pages.map(pageEls =>
        pageEls.map(el => {
          if (el.type === 'service') {
            const baseCount = el.serviceCount || 3;
            const totalCount = Math.max(baseCount, savedCount);
            // Compute height including total lines
            const itemHeight = (el.fontSize || 14) * 3.2;
            const itemsHeight = totalCount * itemHeight;
            let totalLinesCount = 1; // always "Total"
            if (savedTaxPct > 0) totalLinesCount += 2; // subtotal + tax
            if (savedFeePct > 0) { totalLinesCount += 1; if (savedTaxPct <= 0) totalLinesCount += 1; } // fee + maybe subtotal
            const totalAreaHeight = totalLinesCount * (el.fontSize || 14) * 1.8;
            const newHeight = Math.max(el.height, itemsHeight) + totalAreaHeight;
            return {
              ...el,
              serviceCount: totalCount,
              height: newHeight,
              showPrice: true,
              totalShowTax: savedTaxPct > 0,
              totalTaxPercent: savedTaxPct,
              totalShowFee: savedFeePct > 0,
              totalFeePercent: savedFeePct,
              totalFeeName: savedFeeName,
            } as CanvasElement;
          }
          return el;
        })
      );
    }

    return pages;
  }, [proposal?.template?.elements, proposal?.document?.templateId, proposal?.document?.values]);

  const bgColor = useMemo(() => {
    if (proposal?.template?.settings?.backgroundColor) return proposal.template.settings.backgroundColor;
    const templateId = proposal?.document?.templateId;
    if (templateId) {
      const starter = starterTemplates.find(t => t.id === templateId);
      if (starter?.settings?.backgroundColor) return starter.settings.backgroundColor;
    }
    return undefined;
  }, [proposal?.template?.settings?.backgroundColor, proposal?.document?.templateId]);

  const hasTemplate = templatePages.some((page) => page.length > 0);

  

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getTotal = (values: Record<string, any>) => {
    const total = values?.total || values?.subtotal || '';
    return total ? `R$ ${total}` : null;
  };

  const isExpired = proposal?.expiresAt && new Date(proposal.expiresAt) < new Date();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Link indisponível</h1>
        <p className="max-w-sm text-center text-sm text-muted-foreground">{blockedMessage}</p>
      </div>
    );
  }

  if (step === 'expired') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Proposta expirada</h1>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          {error || 'Esta proposta não está mais disponível para aprovação.'}
        </p>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-semibold text-foreground">Proposta não encontrada</h1>
        <p className="text-sm text-muted-foreground">{error || 'Este link pode ter expirado.'}</p>
      </div>
    );
  }

  const { document: doc, company } = proposal;
  const total = getTotal(doc.values);

  // ──── STEP: ENTRY SCREEN ────
  if (step === 'entry') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="overflow-hidden border-0 shadow-2xl">
            {/* Company header */}
            <div className="bg-primary px-6 py-8 text-center">
              {company?.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="mx-auto mb-3 h-12 max-w-[160px] object-contain brightness-0 invert" />
              ) : (
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
                  <FileText className="h-6 w-6 text-primary-foreground" />
                </div>
              )}
              <h2 className="text-sm font-medium text-primary-foreground/80">
                {company?.name || 'Freelox'}
              </h2>
            </div>

            <CardContent className="px-6 py-8 text-center">
              <div className="mb-2 flex items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Documento seguro</span>
              </div>

              <h1 className="mb-1 text-xl font-bold text-foreground sm:text-2xl">
                {doc.templateName}
              </h1>
              {doc.clientName && (
                <p className="mb-6 text-sm text-muted-foreground">
                  Preparado para <strong className="text-foreground">{doc.clientName}</strong>
                </p>
              )}

              {total && (
                <div className="mx-auto mb-6 rounded-xl border border-border bg-muted/50 px-6 py-4">
                  <p className="text-xs text-muted-foreground">Valor total</p>
                  <p className="text-2xl font-bold text-foreground">{total}</p>
                </div>
              )}

              {proposal.expiresAt && (
                <div className="mb-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Proposta válida até {formatDate(proposal.expiresAt)}
                </div>
              )}

              {proposal.viewCount > 0 && (
                <div className="mb-4 rounded-lg border border-border bg-muted/50 px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    <Eye className="mr-1.5 inline h-3.5 w-3.5" />
                    Você já visualizou esta proposta
                  </p>
                </div>
              )}

              <Button
                size="lg"
                className="w-full h-14 text-base font-semibold rounded-xl gap-2"
                onClick={handleViewProposal}
                disabled={markingViewed}
              >
                {markingViewed ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Eye className="h-5 w-5" />
                    {proposal.viewCount > 0 ? 'Continuar visualizando' : 'Visualizar proposta'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {company && (
            <div className="mt-6 text-center text-xs text-muted-foreground">
              {company.phone && <p>{company.phone}</p>}
              {company.website && <p>{company.website}</p>}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // ──── STEP: NEGOTIATION SENT ────
  if (step === 'negotiation-sent') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <Card className="border-0 shadow-2xl">
            <CardContent className="px-6 py-10">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
                <MessageSquare className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">Sugestão enviada</h2>
              <p className="text-sm text-muted-foreground">
                Sua sugestão de alteração foi enviada com sucesso. O profissional irá analisar e entrar em contato.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ──── STEP: APPROVED ────
  if (step === 'approved') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <Card className="border-0 shadow-2xl">
            <CardContent className="px-6 py-10">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">Proposta aprovada com sucesso!</h2>
              {proposal.approverName && (
                <p className="mb-1 text-sm text-muted-foreground">
                  Aprovada por <strong className="text-foreground">{proposal.approverName}</strong>
                </p>
              )}
              {proposal.approvedAt && (
                <p className="mb-6 text-xs text-muted-foreground">{formatDate(proposal.approvedAt)}</p>
              )}

              <div className="flex flex-col gap-3">
                {hasTemplate && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                  >
                    {downloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Baixar PDF
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          {company && (
            <div className="mt-6 text-center text-xs text-muted-foreground">
              {company.name && <p>{company.name}</p>}
              {company.phone && <p>{company.phone}</p>}
            </div>
          )}
        </motion.div>

        {/* Hidden off-screen container for PDF capture */}
        {hasTemplate && (
          <div
            aria-hidden
            style={{ position: 'fixed', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none', zIndex: -1 }}
          >
            {templatePages.map((pageElements, idx) => (
              <div
                key={idx}
                ref={(el) => {
                  if (el) pageRefsMap.current.set(idx, el);
                  else pageRefsMap.current.delete(idx);
                }}
                style={{ width: 595, height: 842, overflow: 'hidden' }}
              >
                <CanvasRenderer
                  elements={pageElements}
                  selectedId={null}
                  onSelect={NOOP}
                  onUpdate={NOOP}
                  readOnly
                  variableValues={variableValues}
                  showGrid={false}
                  backgroundColor={bgColor}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ──── STEP: VIEWING / DECISION ────
  const CANVAS_W = proposal?.template?.canvasWidth || 595;
  const CANVAS_H = proposal?.template?.canvasHeight || 842;

  // Compute scale accounting for padding (16px each side on mobile, 24px on desktop)
  const PAD = 16;
  const availW = Math.max(containerSize.w - PAD * 2, 1);
  const availH = Math.max(containerSize.h - PAD * 2, 1);
  const pageCount = templatePages.length;
  // For single page, fit to viewport; for multi-page, scale by width and allow scrolling
  const docScale = containerSize.w > 0 && containerSize.h > 0
    ? pageCount > 1
      ? Math.min(availW / CANVAS_W, 1)
      : Math.min(availW / CANVAS_W, availH / CANVAS_H, 1)
    : 0;

  return (
    <div className="flex h-[100dvh] flex-col bg-muted/30">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card/95 backdrop-blur px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            {company?.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="h-8 max-w-[120px] object-contain"
                style={headerIsDark ? { filter: 'brightness(0) invert(1)' } : undefined}
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <span className="text-sm font-semibold text-foreground">{company?.name || 'Freelox'}</span>
          </div>
          {proposal.expiresAt && !isExpired && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Válida até</span> {new Date(proposal.expiresAt).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
      </header>

      {/* Document area — fills remaining space, centers doc */}
      <div
        ref={docContainerRef}
        className="flex-1 min-h-0 flex justify-center items-start overflow-auto"
        style={{ padding: PAD }}
      >
        {hasTemplate && docScale > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`shrink-0 w-full flex flex-col items-center ${templatePages.length <= 1 ? 'my-auto' : 'pt-4 pb-24'}`}
          >
            {templatePages.length > 1 && (
              <div className="flex items-center justify-center gap-2 mb-3 text-xs text-muted-foreground">
                <FileText className="w-3.5 h-3.5" />
                <span>{templatePages.length} páginas</span>
              </div>
            )}
            {templatePages.map((pageElements, pageIdx) => (
              <div key={pageIdx}>
                {pageIdx > 0 && templatePages.length > 1 && (
                  <div className="flex items-center justify-center py-2 text-xs text-muted-foreground/60">
                    <span>{pageIdx + 1} / {templatePages.length}</span>
                  </div>
                )}
                <div
                  className="mx-auto overflow-hidden"
                  style={{
                    width: CANVAS_W * docScale,
                    height: CANVAS_H * docScale,
                    marginBottom: pageIdx < templatePages.length - 1 ? 4 : 0,
                    borderRadius: 8 * docScale,
                    boxShadow: '0 4px 24px -4px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
                  }}
                >
                <div
                  style={{
                    width: CANVAS_W,
                    height: CANVAS_H,
                    transform: `scale(${docScale})`,
                    transformOrigin: 'top left',
                  }}
                >
                  <CanvasRenderer
                    elements={pageElements}
                    selectedId={null}
                    onSelect={NOOP}
                    onUpdate={NOOP}
                    readOnly
                    variableValues={variableValues}
                    showGrid={false}
                    backgroundColor={bgColor}
                  />
                </div>
              </div>
              </div>
            ))}
          </motion.div>
        ) : !hasTemplate ? (
          /* Fallback: render all dynamic values as a clean list */
          <div className="w-full max-w-lg">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6 sm:p-8">
                <h1 className="mb-1 text-xl font-bold text-foreground">{doc.templateName}</h1>
                <p className="mb-6 text-sm text-muted-foreground">
                  Para <strong className="text-foreground">{doc.clientName || 'cliente'}</strong>
                </p>
                <div className="space-y-0">
                  {Object.entries(doc.values)
                    .filter(([key, value]) => value && value !== '' && !['__logo_url__', 'data_de_hoje'].includes(key))
                    .map(([key, value]) => {
                      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                      return (
                        <div key={key} className="flex items-center justify-between border-b border-border py-3 last:border-0">
                          <span className="text-sm text-muted-foreground">{label}</span>
                          <span className="text-sm font-medium text-foreground text-right max-w-[60%]">{String(value)}</span>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Carregando documento...</p>
          </div>
        )}
      </div>

      {/* Sticky action bar — appears after delay */}
      {!isExpired && (step === 'decision' || showApproveForm || showNegotiationForm) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="shrink-0 border-t border-border/60 bg-card/90 backdrop-blur px-4 py-3 sm:px-6 sm:py-4 safe-area-bottom"
        >
          <div className="mx-auto max-w-5xl">
            <AnimatePresence mode="wait">
              {showApproveForm ? (
                <motion.div
                  key="approve-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <p className="text-sm text-muted-foreground">Insira seu nome para confirmar a aprovação.</p>
                  <Input
                    placeholder="Seu nome completo"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    maxLength={200}
                  />
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setShowApproveForm(false)}>Cancelar</Button>
                    <Button className="flex-1" onClick={handleApprove} disabled={!approverName.trim() || approving}>
                      {approving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                      Confirmar
                    </Button>
                  </div>
                </motion.div>
              ) : showNegotiationForm ? (
                <motion.div
                  key="negotiation-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <p className="text-sm text-muted-foreground">Descreva o que gostaria de alterar na proposta.</p>
                  <Textarea
                    placeholder="Ex: Gostaria de ajustar o valor do serviço X..."
                    value={negotiationMessage}
                    onChange={(e) => setNegotiationMessage(e.target.value)}
                    className="min-h-[80px]"
                    maxLength={1000}
                  />
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setShowNegotiationForm(false)}>Cancelar</Button>
                    <Button variant="secondary" className="flex-1" onClick={handleSendNegotiation} disabled={!negotiationMessage.trim() || sendingNegotiation}>
                      {sendingNegotiation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                      Enviar
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="decision-buttons"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <p className="text-center text-sm text-muted-foreground">Se fizer sentido pra você:</p>
                  <div className="flex gap-2.5">
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1 h-11 rounded-xl gap-2 text-sm border-primary/30 text-primary hover:bg-primary/5"
                      onClick={() => setShowApproveForm(true)}
                    >
                      <CheckCircle className="h-4 w-4 shrink-0" /> Aprovar proposta
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1 h-11 rounded-xl gap-2 text-sm"
                      onClick={() => setShowNegotiationForm(true)}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" /> Sugerir ajuste
                    </Button>
                  </div>
                  {hasTemplate && (
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground"
                        onClick={handleDownloadPdf}
                        disabled={downloadingPdf}
                      >
                        {downloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Baixar PDF
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {isExpired && (
        <div className="shrink-0 border-t border-border bg-muted/50 px-4 py-4 text-center">
          <p className="text-sm font-medium text-foreground">Esta proposta expirou</p>
          <p className="text-xs text-muted-foreground">Entre em contato para solicitar uma nova proposta.</p>
        </div>
      )}

      {/* Hidden off-screen container for PDF capture — renders all pages at native resolution */}
      {hasTemplate && (
        <div
          aria-hidden
          style={{ position: 'fixed', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none', zIndex: -1 }}
        >
          {templatePages.map((pageElements, idx) => (
            <div
              key={idx}
              ref={(el) => {
                if (el) pageRefsMap.current.set(idx, el);
                else pageRefsMap.current.delete(idx);
              }}
              style={{ width: CANVAS_W, height: CANVAS_H, overflow: 'hidden' }}
            >
              <CanvasRenderer
                elements={pageElements}
                selectedId={null}
                onSelect={NOOP}
                onUpdate={NOOP}
                readOnly
                variableValues={variableValues}
                showGrid={false}
                backgroundColor={bgColor}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProposalView;
