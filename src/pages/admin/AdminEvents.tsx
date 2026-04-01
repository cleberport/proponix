import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const EVENT_TYPES = [
  'user_signed_up', 'user_logged_in', 'proposal_created', 'proposal_sent',
  'proposal_viewed', 'proposal_approved', 'proposal_expired',
  'template_created', 'plan_upgraded',
];

export default function AdminEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false }).limit(500);
    if (data) setEvents(data);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (typeFilter !== 'all' && e.event_type !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return e.event_type.toLowerCase().includes(q) || e.user_id?.toLowerCase().includes(q) || JSON.stringify(e.metadata).toLowerCase().includes(q);
      }
      return true;
    });
  }, [events, search, typeFilter]);

  const formatDate = (d: string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <AdminLayout title="Eventos" description="Timeline de eventos da plataforma">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48 h-10"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" className="h-10 w-10" onClick={fetchEvents}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Metadata</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Nenhum evento</TableCell></TableRow>
              ) : filtered.map(e => (
                <TableRow key={e.id}>
                  <TableCell><Badge variant="secondary" className="font-mono text-xs">{e.event_type}</Badge></TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{e.user_id?.slice(0, 8) || '—'}...</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{JSON.stringify(e.metadata)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(e.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
