import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Zap, Clock, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger_event: string;
  condition_type: string;
  condition_value: string;
  delay_minutes: number;
  template_id: string;
  enabled: boolean;
}

interface TemplateOption {
  id: string;
  label: string;
}

const TRIGGER_LABELS: Record<string, string> = {
  user_signup: 'Cadastro de usuário',
  proposal_viewed: 'Proposta visualizada',
  proposal_approved: 'Proposta aprovada',
  proposal_expired: 'Proposta expirada',
  trial_expiring: 'Trial expirando',
  trial_expired: 'Trial expirado',
  payment_success: 'Pagamento confirmado',
  payment_failed: 'Falha no pagamento',
};

const CONDITION_LABELS: Record<string, string> = {
  none: 'Nenhuma',
  days_before_expiry: 'Dias antes da expiração',
  not_approved: 'Não aprovado após delay',
};

export default function AdminAutomations() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editAuto, setEditAuto] = useState<Automation | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    trigger_event: '',
    condition_type: 'none',
    condition_value: '',
    delay_minutes: 0,
    template_id: '',
  });

  const fetchData = async () => {
    setLoading(true);
    const [autoRes, templRes] = await Promise.all([
      supabase.from('email_automations').select('*').order('created_at'),
      supabase.from('email_templates').select('id, label').order('created_at'),
    ]);
    if (autoRes.data) setAutomations(autoRes.data as Automation[]);
    if (templRes.data) setTemplates(templRes.data as TemplateOption[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openEdit = (a: Automation) => {
    setEditAuto(a);
    setEditForm({
      name: a.name,
      description: a.description,
      trigger_event: a.trigger_event,
      condition_type: a.condition_type,
      condition_value: a.condition_value,
      delay_minutes: a.delay_minutes,
      template_id: a.template_id,
    });
  };

  const handleSave = async () => {
    if (!editAuto) return;
    const { error } = await supabase
      .from('email_automations')
      .update({
        name: editForm.name,
        description: editForm.description,
        trigger_event: editForm.trigger_event,
        condition_type: editForm.condition_type,
        condition_value: editForm.condition_value,
        delay_minutes: editForm.delay_minutes,
        template_id: editForm.template_id,
      })
      .eq('id', editAuto.id);
    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
      return;
    }
    toast.success('Automação atualizada');
    setEditAuto(null);
    fetchData();
  };

  const handleToggle = async (a: Automation) => {
    const { error } = await supabase
      .from('email_automations')
      .update({ enabled: !a.enabled })
      .eq('id', a.id);
    if (error) {
      toast.error('Erro ao alterar status');
      return;
    }
    toast.success(a.enabled ? 'Automação desativada' : 'Automação ativada');
    fetchData();
  };

  const handleAddNew = async () => {
    if (templates.length === 0) {
      toast.error('Crie pelo menos um template antes');
      return;
    }
    const { error } = await supabase.from('email_automations').insert({
      name: 'Nova automação',
      description: '',
      trigger_event: 'user_signup',
      template_id: templates[0].id,
    });
    if (error) {
      toast.error('Erro ao criar: ' + error.message);
      return;
    }
    toast.success('Automação criada');
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">Automações de E-mail</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Defina regras para envio automático de emails baseados em eventos
          </p>
        </div>
        <Button onClick={handleAddNew} size="sm">
          <Zap className="mr-1.5 h-3.5 w-3.5" />
          Nova regra
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Gatilho</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Delay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {automations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Nenhuma automação configurada
                  </TableCell>
                </TableRow>
              ) : (
                automations.map((a) => {
                  const tmpl = templates.find((t) => t.id === a.template_id);
                  return (
                    <TableRow key={a.id} className={!a.enabled ? 'opacity-50' : ''}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{a.name}</p>
                          {a.description && (
                            <p className="text-xs text-muted-foreground">{a.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs font-medium">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          {TRIGGER_LABELS[a.trigger_event] || a.trigger_event}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {tmpl?.label || a.template_id}
                        </span>
                      </TableCell>
                      <TableCell>
                        {a.delay_minutes > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {a.delay_minutes >= 60
                              ? `${Math.floor(a.delay_minutes / 60)}h ${a.delay_minutes % 60 > 0 ? `${a.delay_minutes % 60}min` : ''}`
                              : `${a.delay_minutes}min`}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Imediato</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={a.enabled}
                          onCheckedChange={() => handleToggle(a)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(a)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editAuto} onOpenChange={() => setEditAuto(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Automação</DialogTitle>
            <DialogDescription>Configure o gatilho, condição e ação</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Descrição</Label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Gatilho (evento)</Label>
              <Select
                value={editForm.trigger_event}
                onValueChange={(v) => setEditForm({ ...editForm, trigger_event: v })}
              >
                <SelectTrigger className="mt-1 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Condição</Label>
              <Select
                value={editForm.condition_type}
                onValueChange={(v) => setEditForm({ ...editForm, condition_type: v })}
              >
                <SelectTrigger className="mt-1 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editForm.condition_type !== 'none' && (
              <div>
                <Label className="text-xs text-muted-foreground">Valor da condição</Label>
                <Input
                  value={editForm.condition_value}
                  onChange={(e) => setEditForm({ ...editForm, condition_value: e.target.value })}
                  className="mt-1 h-10"
                  placeholder="Ex: 3 (dias)"
                />
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Delay (minutos)</Label>
              <Input
                type="number"
                min={0}
                value={editForm.delay_minutes}
                onChange={(e) =>
                  setEditForm({ ...editForm, delay_minutes: parseInt(e.target.value) || 0 })
                }
                className="mt-1 h-10"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                0 = envio imediato. Delays &gt; 0 requerem processamento em background.
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Template de e-mail</Label>
              <Select
                value={editForm.template_id}
                onValueChange={(v) => setEditForm({ ...editForm, template_id: v })}
              >
                <SelectTrigger className="mt-1 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAuto(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
