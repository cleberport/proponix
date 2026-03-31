import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Mail, CheckCircle2, XCircle, AlertTriangle, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface EmailLog {
  id: string;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  message_id: string | null;
  created_at: string;
}

const STATUS_BADGES: Record<string, { label: string; className: string; icon: any }> = {
  sent: { label: 'Enviado', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: AlertTriangle },
  failed: { label: 'Falhou', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  dlq: { label: 'Falhou', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  suppressed: { label: 'Suprimido', className: 'bg-muted text-muted-foreground', icon: AlertTriangle },
};

const formatDate = (d: string) =>
  new Date(d).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function AdminEmailLogs() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('email_send_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      toast.error('Erro ao carregar logs');
      setLoading(false);
      return;
    }
    // Deduplicate by message_id (keep latest)
    const seen = new Map<string, EmailLog>();
    for (const row of data || []) {
      const key = row.message_id || row.id;
      const existing = seen.get(key);
      if (!existing || new Date(row.created_at) > new Date(existing.created_at)) {
        seen.set(key, row as EmailLog);
      }
    }
    setLogs(Array.from(seen.values()));
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const templateNames = useMemo(
    () => [...new Set(logs.map((l) => l.template_name))].sort(),
    [logs]
  );

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (templateFilter !== 'all' && l.template_name !== templateFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !l.recipient_email.toLowerCase().includes(q) &&
          !l.template_name.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [logs, statusFilter, templateFilter, search]);

  const stats = useMemo(() => {
    const s = { total: logs.length, sent: 0, failed: 0, pending: 0 };
    for (const l of logs) {
      if (l.status === 'sent') s.sent++;
      else if (l.status === 'failed' || l.status === 'dlq') s.failed++;
      else if (l.status === 'pending') s.pending++;
    }
    return s;
  }, [logs]);

  const statCards = [
    { label: 'Total', value: stats.total, icon: Mail, color: 'text-foreground' },
    { label: 'Enviados', value: stats.sent, icon: CheckCircle2, color: 'text-emerald-600' },
    { label: 'Pendentes', value: stats.pending, icon: AlertTriangle, color: 'text-yellow-600' },
    { label: 'Falhas', value: stats.failed, icon: XCircle, color: 'text-red-600' },
  ];

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por email ou template..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="sent">Enviado</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="failed">Falhou</SelectItem>
            <SelectItem value="dlq">DLQ</SelectItem>
          </SelectContent>
        </Select>
        <Select value={templateFilter} onValueChange={setTemplateFilter}>
          <SelectTrigger className="w-[180px] h-10">
            <SelectValue placeholder="Template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos templates</SelectItem>
            {templateNames.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={fetchLogs}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="hidden md:table-cell">Erro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Nenhum log encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((l) => {
                  const badge = STATUS_BADGES[l.status] || STATUS_BADGES.pending;
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium text-sm">{l.template_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {l.recipient_email}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                          <badge.icon className="h-3 w-3" />
                          {badge.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(l.created_at)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                        {l.error_message || '—'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
