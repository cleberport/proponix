import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle, FileText, Loader2, AlertCircle, Eye, Clock,
  MessageSquare, Download, ShieldCheck,
} from 'lucide-react';
import CanvasRenderer from '@/components/editor/CanvasRenderer';
import { CanvasElement } from '@/types/template';
import { generateVectorPdf } from '@/lib/pdfGenerator';
import { motion, AnimatePresence } from 'framer-motion';

interface ProposalData {
  id: string;
  token: string;
  status: string;
  viewedAt: string | null;
  approvedAt: string | null;
  approverName: string;
  expiresAt: string | null;
  negotiationMessage: string | null;
  document: {
    clientName: string;
    templateName: string;
    templateId: string;
    fileName: string;
    values: Record<string, any>;
    generatedAt: string;
  };
  template: {
    elements: CanvasElement[];
    settings: { taxRate?: number; showTax?: boolean; backgroundColor?: string } | null;
    canvasWidth: number;
    canvasHeight: number;
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

type Step = 'entry' | 'viewing' | 'approved' | 'negotiation-sent' | 'expired';

const ProposalView = () => {
  const { token } = useParams<{ token: string }>();
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
    if (!proposal?.template?.elements) return;
    setDownloadingPdf(true);
    try {
      const { generateVectorPdf } = await import('@/lib/pdfGenerator');
      const bgColor = proposal.template.settings?.backgroundColor;
      const blob = await generateVectorPdf(
        [proposal.template.elements],
        variableValues,
        proposal.document.fileName,
        { backgroundColor: bgColor }
      );
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = proposal.document.fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // silent
    } finally {
      setDownloadingPdf(false);
    }
  };

  const variableValues = useMemo(() => {
    if (!proposal) return {};
    const vals = proposal.document.values as Record<string, any>;
    const result: Record<string, string> = {};
    Object.entries(vals).forEach(([k, v]) => {
      result[k] = String(v ?? '');
    });
    if (proposal.company?.logoUrl) {
      result['__logo_url__'] = proposal.company.logoUrl;
    }
    return result;
  }, [proposal]);

  const templateElements = useMemo(() => {
    if (!proposal?.template?.elements) return [];
    return proposal.template.elements as CanvasElement[];
  }, [proposal]);

  const hasTemplate = templateElements.length > 0;

  // Responsive scaling for document render
  const docContainerRef = useRef<HTMLDivElement | null>(null);
  const [docScale, setDocScale] = useState(1);

  useEffect(() => {
    const node = docContainerRef.current;
    if (!node || !hasTemplate) return;
    const cw = proposal?.template?.canvasWidth || 595;
    const update = () => {
      const w = node.clientWidth;
      if (w > 0) setDocScale(Math.min(w / cw, 1));
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(node);
    return () => obs.disconnect();
  }, [hasTemplate, proposal?.template?.canvasWidth]);

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

  const { document: doc, company, template } = proposal;
  const total = getTotal(doc.values);
  const canvasW = template?.canvasWidth || 595;
  const canvasH = template?.canvasHeight || 842;
  const bgColor = template?.settings?.backgroundColor || '#ffffff';

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
                    Visualizar proposta
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
      </div>
    );
  }

  // ──── STEP: VIEWING ────
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="h-8 max-w-[120px] object-contain" />
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

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Document Visual Render */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {hasTemplate ? (
              <div className="mb-6">
                <div
                  ref={docContainerRef}
                  className="relative mx-auto w-full overflow-hidden rounded-lg shadow-lg bg-white"
                  style={{
                    maxWidth: canvasW,
                    aspectRatio: `${canvasW} / ${canvasH}`,
                  }}
                >
                  <div
                    className="absolute inset-0 origin-top-left"
                    style={{
                      width: canvasW,
                      height: canvasH,
                      transform: `scale(${docScale})`,
                    }}
                  >
                    <CanvasRenderer
                      elements={templateElements}
                      selectedId={null}
                      onSelect={() => {}}
                      onUpdate={() => {}}
                      readOnly
                      variableValues={variableValues}
                      showGrid={false}
                      backgroundColor={bgColor}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6 space-y-4">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h1 className="mb-1 text-xl font-semibold text-foreground sm:text-2xl">{doc.templateName}</h1>
                  <p className="mb-6 text-sm text-muted-foreground">Proposta para {doc.clientName || 'cliente'}</p>
                  <div className="space-y-3">
                    {Object.entries(doc.values)
                      .filter(([key]) => !['total', 'subtotal', 'tax', 'imposto'].includes(key.toLowerCase()))
                      .map(([key, value]) => {
                        if (!value || value === '') return null;
                        const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                        return (
                          <div key={key} className="flex items-start justify-between gap-4 border-b border-border/50 pb-2 last:border-0">
                            <span className="text-sm text-muted-foreground">{label}</span>
                            <span className="text-sm font-medium text-foreground text-right max-w-[60%]">{String(value)}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
                {total && (
                  <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Valor total</p>
                    <p className="text-3xl font-bold text-foreground">{total}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Action Section */}
        {!isExpired && (
          <div className="mt-6 space-y-3">
            <AnimatePresence mode="wait">
              {showApproveForm ? (
                <motion.div
                  key="approve-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <h2 className="mb-4 text-lg font-semibold text-foreground">Aprovar proposta</h2>
                  <p className="mb-4 text-sm text-muted-foreground">Insira seu nome para confirmar a aprovação.</p>
                  <Input
                    placeholder="Seu nome completo"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    className="mb-4"
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
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <h2 className="mb-4 text-lg font-semibold text-foreground">Sugerir alteração</h2>
                  <p className="mb-4 text-sm text-muted-foreground">Descreva o que gostaria de alterar na proposta.</p>
                  <Textarea
                    placeholder="Ex: Gostaria de ajustar o valor do serviço X..."
                    value={negotiationMessage}
                    onChange={(e) => setNegotiationMessage(e.target.value)}
                    className="mb-4 min-h-[100px]"
                    maxLength={1000}
                  />
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setShowNegotiationForm(false)}>Cancelar</Button>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={handleSendNegotiation}
                      disabled={!negotiationMessage.trim() || sendingNegotiation}
                    >
                      {sendingNegotiation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                      Enviar
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="action-buttons"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <Button
                    size="lg"
                    className="w-full h-14 text-base font-semibold rounded-xl gap-2"
                    onClick={() => setShowApproveForm(true)}
                  >
                    <CheckCircle className="h-5 w-5" /> Aprovar proposta
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-12 rounded-xl gap-2"
                    onClick={() => setShowNegotiationForm(true)}
                  >
                    <MessageSquare className="h-4 w-4" /> Sugerir alteração
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {isExpired && (
          <div className="mt-6 rounded-xl border border-border bg-muted/50 p-6 text-center">
            <Clock className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="font-semibold text-foreground">Esta proposta expirou</p>
            <p className="text-sm text-muted-foreground">Entre em contato para solicitar uma nova proposta.</p>
          </div>
        )}

        {/* Footer */}
        {company && (
          <div className="mt-8 text-center text-xs text-muted-foreground">
            {company.name && <p>{company.name}</p>}
            {company.phone && <p>{company.phone}</p>}
            {company.website && <p>{company.website}</p>}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProposalView;
