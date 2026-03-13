import { useState, useRef } from 'react';
import { getSettings, saveSettings, AppSettings, restoreDefaultTemplates, getStarterTemplates, getSavedTemplates } from '@/lib/templateStorage';
import { decimalToPercent, percentToDecimal } from '@/lib/calculations';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Upload, X, Moon, Sun, RotateCcw, Star } from 'lucide-react';
import { toast } from 'sonner';

const SettingsPage = () => {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allTemplates = [...getStarterTemplates(), ...getSavedTemplates()];

  const update = (partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const handleSave = () => {
    saveSettings(settings);
    if (settings.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    toast.success('Configurações salvas');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        update({ logoUrl: url, logoWidth: img.naturalWidth, logoHeight: img.naturalHeight, logoAspectRatio: img.naturalWidth / img.naturalHeight });
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    update({ theme: newTheme });
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    saveSettings({ ...settings, theme: newTheme });
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground md:text-2xl">Configurações</h1>
        <Button size="sm" className="h-10 md:h-9" onClick={handleSave}>
          <Save className="mr-1.5 h-4 w-4" />
          Salvar
        </Button>
      </div>

      <div className="flex flex-col gap-5">
        {/* Theme */}
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.theme === 'dark' ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-muted-foreground" />}
              <span className="text-sm font-medium text-foreground">{settings.theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}</span>
            </div>
            <Switch checked={settings.theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
        </section>

        {/* Default template */}
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold text-foreground">Template Padrão</h2>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">Abre automaticamente na tela de geração</p>
          <Select value={settings.defaultTemplateId || 'none'} onValueChange={(v) => update({ defaultTemplateId: v === 'none' ? '' : v })}>
            <SelectTrigger className="h-11 md:h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {allTemplates.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </section>

        {/* Company */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">Empresa</h2>
          <div className="flex flex-col gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input value={settings.companyName} onChange={(e) => update({ companyName: e.target.value })} placeholder="Nome da empresa" className="mt-1 h-11 md:h-9" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">CNPJ</Label>
              <Input value={settings.companyCnpj} onChange={(e) => update({ companyCnpj: e.target.value })} placeholder="00.000.000/0000-00" className="mt-1 h-11 md:h-9" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input value={settings.companyEmail} onChange={(e) => update({ companyEmail: e.target.value })} placeholder="contato@empresa.com" className="mt-1 h-11 md:h-9" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Telefone</Label>
                <Input value={settings.companyPhone} onChange={(e) => update({ companyPhone: e.target.value })} placeholder="(11) 99999-0000" className="mt-1 h-11 md:h-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Website</Label>
              <Input value={settings.companyWebsite} onChange={(e) => update({ companyWebsite: e.target.value })} placeholder="https://www.empresa.com" className="mt-1 h-11 md:h-9" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Endereço</Label>
              <Input value={settings.companyAddress} onChange={(e) => update({ companyAddress: e.target.value })} placeholder="Endereço completo" className="mt-1 h-11 md:h-9" />
            </div>
          </div>
        </section>

        {/* Logo */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Logo</h2>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          {settings.logoUrl ? (
            <div className="flex items-center gap-3">
              <div className="relative w-16 rounded-lg border border-border bg-accent/30 overflow-hidden">
                <img src={settings.logoUrl} alt="Logo" className="w-full object-contain" style={{ height: 'auto' }} />
                <button className="absolute top-0 right-0 p-0.5 bg-card/80 rounded-bl" onClick={() => update({ logoUrl: '', logoWidth: undefined, logoHeight: undefined, logoAspectRatio: undefined })}>
                  <X className="h-3 w-3" />
                </button>
              </div>
              <Button variant="outline" size="sm" className="h-10 md:h-9" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-1.5 h-3.5 w-3.5" /> Substituir
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="h-10 md:h-9" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Enviar Logo
            </Button>
          )}
        </section>

        {/* Tax rate */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Taxa de Imposto Padrão</h2>
          <div className="flex items-center gap-2">
            <Input
              type="number" step="0.01"
              value={decimalToPercent(settings.defaultTaxRate)}
              onChange={(e) => update({ defaultTaxRate: percentToDecimal(parseFloat(e.target.value) || 0) })}
              className="h-11 md:h-9 max-w-[120px]"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Ex: 10 = 10%, 11.29 = 11,29%</p>
        </section>

        {/* PDF name */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Nome Padrão do PDF</h2>
          <Input value={settings.pdfBaseName} onChange={(e) => update({ pdfBaseName: e.target.value })} placeholder="Ex: Orçamento PlayPort" className="h-11 md:h-9" />
          <p className="mt-1 text-[10px] text-muted-foreground">{settings.pdfBaseName || 'Orçamento'} 001.pdf, {settings.pdfBaseName || 'Orçamento'} 002.pdf...</p>
        </section>

        {/* Restore */}
        <section className="rounded-xl border border-border bg-card p-4">
          <Button variant="outline" size="sm" className="h-10 md:h-9" onClick={() => { restoreDefaultTemplates(); toast.success('Templates restaurados'); }}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restaurar Templates Padrão
          </Button>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
