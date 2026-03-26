import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, Loader2, AlertCircle } from 'lucide-react';
import CanvasRenderer from '@/components/editor/CanvasRenderer';
import { CanvasElement } from '@/types/template';

interface ProposalData {
  id: string;
  token: string;
  status: string;
  viewedAt: string | null;
  approvedAt: string | null;
  approverName: string;
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
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchProposal();
  }, [token]);

  const fetchProposal = async () => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/proposal-public?token=${encodeURIComponent(token!)}`,
        { headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
      );
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data.error === 'blocked') {
          setBlocked(true);
          setBlockedMessage(data.message || 'Este orçamento já foi visualizado e não está mais disponível.');
          return;
        }
        throw new Error(data.error || 'Erro');
      }
      setProposal(data.proposal);
      if (data.proposal.status === 'aprovado') setApproved(true);
    } catch (err: any) {
      setError(err.message || 'Proposta não encontrada');
    } finally {
      setLoading(false);
    }
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
          body: JSON.stringify({ approverName: approverName.trim() }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro');
      setApproved(true);
      setShowApproveForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApproving(false);
    }
  };

  const variableValues = useMemo(() => {
    if (!proposal) return {};
    const vals = proposal.document.values as Record<string, any>;
    const result: Record<string, string> = {};
    Object.entries(vals).forEach(([k, v]) => {
      result[k] = String(v ?? '');
    });
    // Add company logo if available
    if (proposal.company?.logoUrl) {
      result['__logo_url__'] = proposal.company.logoUrl;
    }
    return result;
  }, [proposal]);

  const hasTemplate = proposal?.template?.elements && proposal.template.elements.length > 0;

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

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

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 sm:px-6 sm:py-4">
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
          <div className="flex items-center gap-2">
            {approved && (
              <Badge variant="default" className="bg-green-600 text-white">
                <CheckCircle className="mr-1 h-3 w-3" /> Aprovada
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Document Visual Render */}
        {hasTemplate ? (
          <div className="mb-6">
            <div
              className="mx-auto overflow-hidden rounded-lg shadow-lg"
              style={{ maxWidth: canvasW }}
            >
              {/* Responsive scaling wrapper */}
              <div className="w-full" style={{ aspectRatio: `${canvasW} / ${canvasH}` }}>
                <div
                  className="origin-top-left"
                  style={{
                    width: canvasW,
                    height: canvasH,
                    transform: `scale(var(--proposal-scale, 1))`,
                  }}
                  ref={(el) => {
                    if (!el) return;
                    const parent = el.parentElement;
                    if (!parent) return;
                    const observer = new ResizeObserver(() => {
                      const scale = parent.clientWidth / canvasW;
                      el.style.setProperty('--proposal-scale', String(Math.min(scale, 1)));
                    });
                    observer.observe(parent);
                    // Initial scale
                    const scale = parent.clientWidth / canvasW;
                    el.style.setProperty('--proposal-scale', String(Math.min(scale, 1)));
                  }}
                >
                  <CanvasRenderer
                    elements={template!.elements}
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
          </div>
        ) : (
          /* Fallback: show proposal details as structured data */
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

        {/* Approval Section */}
        <div className="mt-6">
          {approved ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-950/30">
              <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-600" />
              <h2 className="text-lg font-semibold text-green-800 dark:text-green-400">Proposta aprovada</h2>
              {proposal.approverName && (
                <p className="mt-1 text-sm text-green-700 dark:text-green-500">Aprovada por {proposal.approverName}</p>
              )}
              {proposal.approvedAt && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-600">{formatDate(proposal.approvedAt)}</p>
              )}
            </div>
          ) : showApproveForm ? (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Aprovar proposta</h2>
              <p className="mb-4 text-sm text-muted-foreground">Por favor, insira seu nome para confirmar a aprovação.</p>
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
                  Confirmar aprovação
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="lg"
              className="w-full h-14 text-base font-semibold rounded-xl"
              onClick={() => setShowApproveForm(true)}
            >
              <CheckCircle className="mr-2 h-5 w-5" /> Aprovar proposta
            </Button>
          )}
        </div>

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
