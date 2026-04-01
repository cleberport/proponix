import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function AdminDocuments() {
  const [docs, setDocs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('generated_documents').select('*').order('created_at', { ascending: false }).limit(200);
      if (data) setDocs(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = docs.filter(d => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return d.file_name?.toLowerCase().includes(q) || d.client_name?.toLowerCase().includes(q) || d.template_name?.toLowerCase().includes(q);
  });

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  return (
    <AdminLayout title="Documentos" description="Documentos gerados na plataforma">
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Nenhum documento</TableCell></TableRow>
              ) : filtered.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium text-sm">{d.file_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.client_name || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.template_name || '—'}</TableCell>
                  <TableCell><span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">{d.status}</span></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(d.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
