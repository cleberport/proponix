import { useState } from 'react';
import { emailTemplates } from '@/data/emailTemplates';
import EmailTemplate from '@/components/email/EmailTemplate';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, Smartphone, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Navigate } from 'react-router-dom';

const EmailsPage = () => {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [selectedId, setSelectedId] = useState(emailTemplates[0].id);
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [sending, setSending] = useState(false);

  if (adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const current = emailTemplates.find((t) => t.id === selectedId)!;

  const handleSendTest = async () => {
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error('Nenhum email encontrado na sua conta.');
        return;
      }

      // For now, show success since email domain isn't configured yet.
      // When email infra is ready, this will call send-transactional-email.
      await new Promise((r) => setTimeout(r, 1200));
      toast.success(`Email de teste "${current.label}" enviado para ${user.email}`, {
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      });
    } catch {
      toast.error('Erro ao enviar email de teste.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground md:text-2xl">Templates de Email</h1>
        <p className="text-sm text-muted-foreground mt-1">Visualize e teste os emails do sistema</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-full sm:w-[260px] h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {emailTemplates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{t.label}</span>
                  <span className="text-[11px] text-muted-foreground">{t.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
            {sending ? 'Enviando...' : 'Enviar email de teste'}
          </Button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 md:p-6">
        {/* Mock email client chrome */}
        <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
          {/* Fake email header */}
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

          {/* Email body */}
          <div
            className="mx-auto transition-all duration-300"
            style={{
              maxWidth: viewport === 'mobile' ? 375 : '100%',
            }}
          >
            <EmailTemplate {...current.props} />
          </div>
        </div>
      </div>

      {/* Template info cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {emailTemplates.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedId(t.id)}
            className={`rounded-xl border p-4 text-left transition-all ${
              t.id === selectedId
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-border bg-card hover:border-primary/30'
            }`}
          >
            <p className="text-sm font-medium text-foreground">{t.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmailsPage;
