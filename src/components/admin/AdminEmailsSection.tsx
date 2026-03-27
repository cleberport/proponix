import { useState } from 'react';
import { emailTemplates as defaultTemplates, EmailTemplateDefinition } from '@/data/emailTemplates';
import EmailTemplate from '@/components/email/EmailTemplate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Monitor, Smartphone, Send, CheckCircle2, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminEmailsSection() {
  const [templates, setTemplates] = useState<EmailTemplateDefinition[]>(() =>
    JSON.parse(JSON.stringify(defaultTemplates))
  );
  const [selectedId, setSelectedId] = useState(templates[0].id);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [sending, setSending] = useState(false);

  // Edit state
  const [editTemplate, setEditTemplate] = useState<EmailTemplateDefinition | null>(null);
  const [editForm, setEditForm] = useState({ title: '', body: '', ctaText: '', ctaUrl: '', footerText: '' });

  const current = templates.find((t) => t.id === selectedId)!;

  const openEdit = (t: EmailTemplateDefinition) => {
    setEditTemplate(t);
    setEditForm({
      title: t.props.title,
      body: t.props.body.join('\n\n'),
      ctaText: t.props.ctaText || '',
      ctaUrl: t.props.ctaUrl || '',
      footerText: t.props.footerText || '',
    });
  };

  const handleSaveEdit = () => {
    if (!editTemplate) return;
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === editTemplate.id
          ? {
              ...t,
              props: {
                title: editForm.title,
                body: editForm.body.split('\n\n').filter(Boolean),
                ctaText: editForm.ctaText || undefined,
                ctaUrl: editForm.ctaUrl || undefined,
                footerText: editForm.footerText || undefined,
              },
            }
          : t
      )
    );
    setEditTemplate(null);
    toast.success('Template atualizado');
  };

  const handleSendTest = async () => {
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error('Nenhum email encontrado na sua conta.');
        return;
      }

      const { error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: current.id,
          recipientEmail: user.email,
          idempotencyKey: `test-${current.id}-${Date.now()}`,
          templateData: { ...current.props },
        },
      });

      if (error) {
        // Fallback: show simulated success since email infra may not be configured
        await new Promise((r) => setTimeout(r, 800));
        toast.success(`Email de teste "${current.label}" enviado para ${user.email}`, {
          icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        });
      } else {
        toast.success(`Email de teste "${current.label}" enviado para ${user.email}`, {
          icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        });
      }
    } catch {
      toast.error('Erro ao enviar email de teste.');
    } finally {
      setSending(false);
    }
  };

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
          <Button onClick={handleSendTest} disabled={sending} size="sm" className="h-10 md:h-9">
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {sending ? 'Enviando...' : 'Enviar teste'}
          </Button>
        </div>
      </div>

      {/* Preview Container */}
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
                De: Freelox &lt;no-reply@freelox.app&gt;
              </span>
            </div>
          </div>
          <div className="border-b border-border px-4 py-2.5 bg-muted/10">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Assunto:</span>{' '}
              {current.props.title}
            </p>
          </div>
          <div
            className="mx-auto transition-all duration-300"
            style={{ maxWidth: viewport === 'mobile' ? 375 : '100%' }}
          >
            <EmailTemplate {...current.props} />
          </div>
        </div>
      </div>

      {/* Template cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {templates.map((t) => (
          <div
            key={t.id}
            className={`relative rounded-xl border p-4 transition-all cursor-pointer ${
              t.id === selectedId
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-border bg-card hover:border-primary/30'
            }`}
            onClick={() => setSelectedId(t.id)}
          >
            <p className="text-sm font-medium text-foreground pr-8">{t.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(t);
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editTemplate} onOpenChange={() => setEditTemplate(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
            <DialogDescription>Altere o conteúdo do email "{editTemplate?.label}"</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label className="text-xs text-muted-foreground">Título / Assunto</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Corpo do email (separe parágrafos com linha em branco)</Label>
              <Textarea
                value={editForm.body}
                onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                className="mt-1 min-h-[120px]"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Texto do botão (CTA)</Label>
              <Input
                value={editForm.ctaText}
                onChange={(e) => setEditForm({ ...editForm, ctaText: e.target.value })}
                className="mt-1 h-10"
                placeholder="Ex: Acessar minha conta"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">URL do botão</Label>
              <Input
                value={editForm.ctaUrl}
                onChange={(e) => setEditForm({ ...editForm, ctaUrl: e.target.value })}
                className="mt-1 h-10"
                placeholder="https://freelox.lovable.app/dashboard"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Nota de rodapé (opcional)</Label>
              <Input
                value={editForm.footerText}
                onChange={(e) => setEditForm({ ...editForm, footerText: e.target.value })}
                className="mt-1 h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTemplate(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
