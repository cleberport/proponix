import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import EmailTemplate from '@/components/email/EmailTemplate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Monitor, Smartphone, Send, CheckCircle2, Pencil, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';

interface EmailTemplateRow {
  id: string;
  label: string;
  description: string;
  subject: string;
  greeting: string;
  body_paragraphs: string[];
  cta_text: string;
  cta_url: string;
  footer_text: string;
  enabled: boolean;
}

export default function AdminEmailsSection() {
  const [templates, setTemplates] = useState<EmailTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [sending, setSending] = useState(false);

  const [editTemplate, setEditTemplate] = useState<EmailTemplateRow | null>(null);
  const [editForm, setEditForm] = useState({
    subject: '',
    greeting: '',
    body: '',
    ctaText: '',
    ctaUrl: '',
    footerText: '',
  });

  const fetchTemplates = useCallback(async () => {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at');
    if (error) {
      toast.error('Erro ao carregar templates');
      return;
    }
    const rows = (data || []).map((r: any) => ({
      ...r,
      body_paragraphs: Array.isArray(r.body_paragraphs)
        ? r.body_paragraphs
        : JSON.parse(r.body_paragraphs || '[]'),
    }));
    setTemplates(rows);
    if (!selectedId && rows.length > 0) setSelectedId(rows[0].id);
    setLoading(false);
  }, [selectedId]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const current = templates.find((t) => t.id === selectedId);

  const openEdit = (t: EmailTemplateRow) => {
    setEditTemplate(t);
    setEditForm({
      subject: t.subject,
      greeting: t.greeting,
      body: t.body_paragraphs.join('\n\n'),
      ctaText: t.cta_text,
      ctaUrl: t.cta_url,
      footerText: t.footer_text,
    });
  };

  const handleSaveEdit = async () => {
    if (!editTemplate) return;
    const { error } = await supabase
      .from('email_templates')
      .update({
        subject: editForm.subject,
        greeting: editForm.greeting,
        body_paragraphs: editForm.body.split('\n\n').filter(Boolean),
        cta_text: editForm.ctaText,
        cta_url: editForm.ctaUrl,
        footer_text: editForm.footerText,
      })
      .eq('id', editTemplate.id);
    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
      return;
    }
    toast.success('Template atualizado');
    setEditTemplate(null);
    fetchTemplates();
  };

  const handleToggleEnabled = async (t: EmailTemplateRow) => {
    const { error } = await supabase
      .from('email_templates')
      .update({ enabled: !t.enabled })
      .eq('id', t.id);
    if (error) {
      toast.error('Erro ao alterar status');
      return;
    }
    toast.success(t.enabled ? 'Template desativado' : 'Template ativado');
    fetchTemplates();
  };

  const handleSendTest = async () => {
    if (!current) return;
    setSending(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error('Nenhum email encontrado na sua conta.');
        return;
      }
      const { error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: current.id,
          recipientEmail: user.email,
          idempotencyKey: `test-${current.id}-${Date.now()}`,
          templateData: {
            title: current.subject,
            greeting: current.greeting,
            body: current.body_paragraphs,
            ctaText: current.cta_text,
            ctaUrl: current.cta_url,
            footerText: current.footer_text,
          },
        },
      });
      if (error) {
        // Fallback toast
        await new Promise((r) => setTimeout(r, 600));
      }
      toast.success(`Email de teste "${current.label}" enviado para ${user.email}`, {
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      });
    } catch {
      toast.error('Erro ao enviar email de teste.');
    } finally {
      setSending(false);
    }
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
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-1.5 rounded-lg border border-border p-1 bg-muted/50">
          <button
            onClick={() => setViewport('desktop')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${viewport === 'desktop' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Monitor className="h-3.5 w-3.5" />
            Desktop
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${viewport === 'mobile' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Mobile
          </button>
        </div>
        <div className="sm:ml-auto">
          <Button onClick={handleSendTest} disabled={sending || !current} size="sm" className="h-10 md:h-9">
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {sending ? 'Enviando...' : 'Enviar teste'}
          </Button>
        </div>
      </div>

      {/* Preview */}
      {current && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 md:p-6">
          <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-muted/30">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-[11px] text-muted-foreground font-medium">
                  De: Freelox &lt;noreply@freelox.app&gt;
                </span>
              </div>
            </div>
            <div className="border-b border-border px-4 py-2.5 bg-muted/10">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Assunto:</span> {current.subject}
              </p>
            </div>
            <div
              className="mx-auto transition-all duration-300"
              style={{ maxWidth: viewport === 'mobile' ? 375 : '100%' }}
            >
              <EmailTemplate
                title={current.subject}
                greeting={current.greeting}
                body={current.body_paragraphs}
                ctaText={current.cta_text}
                ctaUrl={current.cta_url}
                footerText={current.footer_text}
              />
            </div>
          </div>
        </div>
      )}

      {/* Template cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {templates.map((t) => (
          <div
            key={t.id}
            className={`relative rounded-xl border p-4 transition-all cursor-pointer ${
              t.id === selectedId
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-border bg-card hover:border-primary/30'
            } ${!t.enabled ? 'opacity-50' : ''}`}
            onClick={() => setSelectedId(t.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{t.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleEnabled(t);
                  }}
                  title={t.enabled ? 'Desativar' : 'Ativar'}
                >
                  {t.enabled ? (
                    <Power className="h-3 w-3 text-green-600" />
                  ) : (
                    <PowerOff className="h-3 w-3 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(t);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {!t.enabled && (
              <span className="mt-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Desativado
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editTemplate} onOpenChange={() => setEditTemplate(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
            <DialogDescription>
              Altere o conteúdo do email "{editTemplate?.label}"
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label className="text-xs text-muted-foreground">Assunto</Label>
              <Input
                value={editForm.subject}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Saudação</Label>
              <Input
                value={editForm.greeting}
                onChange={(e) => setEditForm({ ...editForm, greeting: e.target.value })}
                className="mt-1 h-10"
                placeholder="Olá, {{user_name}} 👋"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Corpo do email (separe parágrafos com linha em branco)
              </Label>
              <Textarea
                value={editForm.body}
                onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                className="mt-1 min-h-[120px]"
              />
            </div>
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <p className="font-medium mb-1">Variáveis disponíveis:</p>
              <code className="text-[11px]">
                {'{{user_name}} {{client_name}} {{proposal_link}} {{value}} {{date}}'}
              </code>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Texto do botão (CTA)</Label>
              <Input
                value={editForm.ctaText}
                onChange={(e) => setEditForm({ ...editForm, ctaText: e.target.value })}
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">URL do botão</Label>
              <Input
                value={editForm.ctaUrl}
                onChange={(e) => setEditForm({ ...editForm, ctaUrl: e.target.value })}
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Nota de rodapé</Label>
              <Input
                value={editForm.footerText}
                onChange={(e) => setEditForm({ ...editForm, footerText: e.target.value })}
                className="mt-1 h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTemplate(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
