import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, Loader2, User, Calendar, DollarSign, Building2, AlertCircle, CalendarPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    fileName: string;
    values: Record<string, any>;
    generatedAt: string;
  };
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

  const getEventDate = () => {
    if (!proposal) return null;
    const v = proposal.document.values as Record<string, any>;
    // Try common date field names
    const dateVal = v?.data_evento || v?.data || v?.date || v?.event_date || v?.data_inicio || null;
    return dateVal ? String(dateVal) : null;
  };

  const getEventLocation = () => {
    if (!proposal) return '';
    const v = proposal.document.values as Record<string, any>;
    return String(v?.local || v?.endereco || v?.location || v?.venue || '');
  };

  const buildCalendarEvent = () => {
    if (!proposal) return null;
    const doc = proposal.document;
    const total = getTotal(doc.values);
    const eventDate = getEventDate();
    const location = getEventLocation();
    const company = proposal.company;

    const title = `${doc.templateName} - ${doc.clientName || 'Cliente'}`;
    const description = [
      `Proposta: ${doc.templateName}`,
      `Cliente: ${doc.clientName || '—'}`,
      total ? `Valor: ${total}` : '',
      company?.name ? `Empresa: ${company.name}` : '',
      company?.phone ? `Telefone: ${company.phone}` : '',
      `Aprovada por: ${proposal.approverName || '—'}`,
    ].filter(Boolean).join('\n');

    // Parse date - try common formats
    let startDate = new Date();
    if (eventDate) {
      // Try dd/mm/yyyy
      const parts = eventDate.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (parts) {
        startDate = new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1]));
      } else {
        const parsed = new Date(eventDate);
        if (!isNaN(parsed.getTime())) startDate = parsed;
      }
    }

    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 2);

    return { title, description, location, startDate, endDate };
  };

  const formatDateForICS = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const handleAppleCalendar = () => {
    const event = buildCalendarEvent();
    if (!event) return;
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Freelox//Proposal//PT',
      'BEGIN:VEVENT',
      `DTSTART:${formatDateForICS(event.startDate)}`,
      `DTEND:${formatDateForICS(event.endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
      `LOCATION:${event.location}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'evento.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGoogleCalendar = () => {
    const event = buildCalendarEvent();
    if (!event) return;
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      details: event.description,
      location: event.location,
      dates: `${fmt(event.startDate)}/${fmt(event.endDate)}`,
    });
    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
  };

  const handleOutlookCalendar = () => {
    const event = buildCalendarEvent();
    if (!event) return;
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: event.title,
      body: event.description,
      location: event.location,
      startdt: event.startDate.toISOString(),
      enddt: event.endDate.toISOString(),
    });
    window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`, '_blank');
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
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          {blockedMessage}
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

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="h-8 max-w-[120px] object-contain" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <span className="text-sm font-semibold text-foreground">
              {company?.name || 'Freelox'}
            </span>
          </div>
          {approved ? (
            <Badge variant="default" className="bg-green-600 text-white">
              <CheckCircle className="mr-1 h-3 w-3" /> Aprovada
            </Badge>
          ) : (
            <Badge variant="secondary">Proposta</Badge>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Proposal Info Card */}
        <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h1 className="mb-1 text-xl font-semibold text-foreground sm:text-2xl">
            {doc.templateName}
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Proposta para {doc.clientName || 'cliente'}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow icon={User} label="Cliente" value={doc.clientName || '—'} />
            <InfoRow icon={Calendar} label="Data" value={formatDate(doc.generatedAt)} />
            {total && <InfoRow icon={DollarSign} label="Valor total" value={total} highlight />}
            {company?.email && <InfoRow icon={Building2} label="Contato" value={company.email} />}
          </div>
        </div>

        {/* Proposal Details */}
        <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wide">
            Detalhes da proposta
          </h2>
          <div className="space-y-3">
            {Object.entries(doc.values)
              .filter(([key]) => !['total', 'subtotal', 'tax', 'imposto'].includes(key.toLowerCase()))
              .map(([key, value]) => {
                if (!value || value === '') return null;
                const label = key
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <div key={key} className="flex items-start justify-between gap-4 border-b border-border/50 pb-2 last:border-0">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium text-foreground text-right max-w-[60%]">
                      {String(value)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Total & Approval */}
        {total && (
          <div className="mb-6 rounded-xl border-2 border-primary/20 bg-primary/5 p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">Valor total</p>
            <p className="text-3xl font-bold text-foreground">{total}</p>
          </div>
        )}

        {/* Approval Section */}
        {approved ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-950/30">
            <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-600" />
            <h2 className="text-lg font-semibold text-green-800 dark:text-green-400">
              Proposta aprovada
            </h2>
            {proposal.approverName && (
              <p className="mt-1 text-sm text-green-700 dark:text-green-500">
                Aprovada por {proposal.approverName}
              </p>
            )}
            {proposal.approvedAt && (
              <p className="mt-1 text-xs text-green-600 dark:text-green-600">
                {formatDate(proposal.approvedAt)}
              </p>
            )}

            {/* Calendar Integration */}
            <div className="mt-5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarPlus className="h-4 w-4" />
                    Adicionar ao calendário
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem onClick={handleGoogleCalendar}>
                    Google Calendar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAppleCalendar}>
                    Apple Calendar (.ics)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleOutlookCalendar}>
                    Outlook
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ) : showApproveForm ? (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Aprovar proposta</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Por favor, insira seu nome para confirmar a aprovação.
            </p>
            <Input
              placeholder="Seu nome completo"
              value={approverName}
              onChange={(e) => setApproverName(e.target.value)}
              className="mb-4"
              maxLength={200}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowApproveForm(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleApprove}
                disabled={!approverName.trim() || approving}
              >
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
            <CheckCircle className="mr-2 h-5 w-5" />
            Aprovar proposta
          </Button>
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

const InfoRow = ({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) => (
  <div className="flex items-center gap-3">
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${highlight ? 'bg-primary/10' : 'bg-muted'}`}>
      <Icon className={`h-4 w-4 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  </div>
);

export default ProposalView;
