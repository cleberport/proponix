import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STATUS_MAP: Record<string, { label: string; icon: any; className: string }> = {
  success: { label: 'Sucesso', icon: CheckCircle, className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  failed: { label: 'Falhou', icon: XCircle, className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  pending: { label: 'Pendente', icon: Clock, className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
};

export default function AdminWebhookLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [logsRes, whRes] = await Promise.all([
      supabase.from('webhook_logs').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('webhooks').select('id, name'),
    ]);
    if (logsRes.data) setLogs(logsRes.data);
    if (whRes.data) {
      const map: Record<string, string> = {};
      whRes.data.forEach((w: any) => { map[w.id] = w.name; });
      setWebhooks(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return l.event_type?.toLowerCase().includes(q) || webhooks[l.webhook_id]?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [logs, search, statusFilter, webhooks]);

  const formatDate = (d: string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <AdminLayout title="Webhook Logs" description="Histórico de entregas de webhooks">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-10"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="success">Sucesso</SelectItem>
            <SelectItem value="failed">Falhou</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" className="h-10 w-10" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Webhook</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Tentativas</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhum log</TableCell></TableRow>
              ) : filtered.map(l => {
                const s = STATUS_MAP[l.status] || STATUS_MAP.pending;
                return (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm font-medium">{webhooks[l.webhook_id] || l.webhook_id?.slice(0, 8)}</TableCell>
                    <TableCell><Badge variant="secondary" className="font-mono text-xs">{l.event_type}</Badge></TableCell>
                    <TableCell><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}><s.icon className="h-3 w-3" />{s.label}</span></TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">{l.status_code || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.attempts}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(l.created_at)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
