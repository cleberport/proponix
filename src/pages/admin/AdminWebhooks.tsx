import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Eye, EyeOff, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const EVENT_OPTIONS = [
  'user_signed_up', 'user_logged_in', 'proposal_created', 'proposal_sent',
  'proposal_viewed', 'proposal_approved', 'proposal_expired',
  'template_created', 'plan_upgraded',
];

interface Webhook {
  id: string;
  name: string;
  url: string;
  secret: string;
  active: boolean;
  events: string[];
  created_at: string;
}

export default function AdminWebhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [editWh, setEditWh] = useState<Webhook | null>(null);
  const [form, setForm] = useState({ name: '', url: '', events: [] as string[] });
  const [isNew, setIsNew] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const fetchWebhooks = async () => {
    setLoading(true);
    const { data } = await supabase.from('webhooks').select('*').order('created_at', { ascending: false });
    if (data) setWebhooks(data as Webhook[]);
    setLoading(false);
  };

  useEffect(() => { fetchWebhooks(); }, []);

  const openNew = () => {
    setIsNew(true);
    setEditWh(null);
    setForm({ name: '', url: '', events: [] });
  };

  const openEdit = (wh: Webhook) => {
    setIsNew(false);
    setEditWh(wh);
    setForm({ name: wh.name, url: wh.url, events: wh.events || [] });
  };

  const handleSave = async () => {
    if (!form.name || !form.url) { toast.error('Nome e URL são obrigatórios'); return; }

    if (isNew) {
      const { error } = await supabase.from('webhooks').insert({ name: form.name, url: form.url, events: form.events });
      if (error) toast.error('Erro: ' + error.message);
      else { toast.success('Webhook criado'); setEditWh(null); setIsNew(false); fetchWebhooks(); }
    } else if (editWh) {
      const { error } = await supabase.from('webhooks').update({ name: form.name, url: form.url, events: form.events }).eq('id', editWh.id);
      if (error) toast.error('Erro: ' + error.message);
      else { toast.success('Webhook atualizado'); setEditWh(null); fetchWebhooks(); }
    }
  };

  const handleToggle = async (wh: Webhook) => {
    await supabase.from('webhooks').update({ active: !wh.active }).eq('id', wh.id);
    fetchWebhooks();
  };

  const handleDelete = async (wh: Webhook) => {
    await supabase.from('webhooks').delete().eq('id', wh.id);
    toast.success('Webhook removido');
    fetchWebhooks();
  };

  const toggleEvent = (event: string) => {
    setForm(prev => ({
      ...prev,
      events: prev.events.includes(event) ? prev.events.filter(e => e !== event) : [...prev.events, event],
    }));
  };

  return (
    <AdminLayout title="Webhooks" description="Configuração de webhooks para integração externa">
      <div className="mb-4">
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Novo Webhook</Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Eventos</TableHead>
                <TableHead>Secret</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : webhooks.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhum webhook configurado</TableCell></TableRow>
              ) : webhooks.map(wh => (
                <TableRow key={wh.id}>
                  <TableCell className="font-medium text-sm">{wh.name}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground max-w-xs truncate">{wh.url}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(wh.events || []).slice(0, 3).map(e => <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>)}
                      {(wh.events || []).length > 3 && <Badge variant="secondary" className="text-xs">+{wh.events.length - 3}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        {showSecrets[wh.id] ? wh.secret : '••••••••'}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowSecrets(p => ({ ...p, [wh.id]: !p[wh.id] }))}>
                        {showSecrets[wh.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(wh.secret); toast.success('Copiado'); }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell><Switch checked={wh.active} onCheckedChange={() => handleToggle(wh)} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(wh)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(wh)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={isNew || !!editWh} onOpenChange={() => { setIsNew(false); setEditWh(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isNew ? 'Novo Webhook' : 'Editar Webhook'}</DialogTitle>
            <DialogDescription>Configure o endpoint e eventos</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 h-10" placeholder="Meu Webhook" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">URL</Label>
              <Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} className="mt-1 h-10" placeholder="https://example.com/webhook" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Eventos</Label>
              <div className="grid grid-cols-2 gap-2">
                {EVENT_OPTIONS.map(event => (
                  <label key={event} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.events.includes(event)} onCheckedChange={() => toggleEvent(event)} />
                    <span className="font-mono text-xs">{event}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsNew(false); setEditWh(null); }}>Cancelar</Button>
            <Button onClick={handleSave}>{isNew ? 'Criar' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
