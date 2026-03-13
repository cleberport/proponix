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
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
        update({
          logoUrl: url,
          logoWidth: img.naturalWidth,
          logoHeight: img.naturalHeight,
          logoAspectRatio: img.naturalWidth / img.naturalHeight,
        });
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    update({ theme: newTheme });
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveSettings({ ...settings, theme: newTheme });
  };

  const handleRestore = () => {
    restoreDefaultTemplates();
    toast.success('Templates padrão restaurados');
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">Configurações</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas preferências e informações da empresa</p>
        </div>
        <Button size="sm" className="h-9 md:h-8" onClick={handleSave}>
          <Save className="mr-1.5 h-3.5 w-3.5" />
          Salvar
        </Button>
      </div>

      <div className="flex flex-col gap-8">
        {/* Aparência */}
        <section className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Aparência</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.theme === 'dark' ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {settings.theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
                </p>
                <p className="text-xs text-muted-foreground">Alternar entre tema claro e escuro</p>
              </div>
            </div>
            <Switch checked={settings.theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
        </section>

        {/* Template Padrão */}
        <section className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            <Star className="mr-1.5 inline h-4 w-4 text-warning" />
            Template Padrão
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            O template padrão abre automaticamente a tela de geração ao acessar /quick
          </p>
          <Select
            value={settings.defaultTemplateId || 'none'}
            onValueChange={(v) => update({ defaultTemplateId: v === 'none' ? '' : v })}
          >
            <SelectTrigger className="h-9 md:h-8">
              <SelectValue placeholder="Selecione um template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {allTemplates.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        {/* Perfil */}
        <section className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Perfil</h2>
          <div>
            <Label className="text-xs text-muted-foreground">Nome</Label>
            <Input
              value={settings.profileName}
              onChange={(e) => update({ profileName: e.target.value })}
              placeholder="Seu nome"
              className="mt-1 h-10 md:h-9"
            />
          </div>
        </section>

        {/* Empresa */}
        <section className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Informações da Empresa</h2>
          <div className="flex flex-col gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Nome da Empresa</Label>
              <Input
                value={settings.companyName}
                onChange={(e) => update({ companyName: e.target.value })}
                placeholder="Nome da empresa"
                className="mt-1 h-10 md:h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">CNPJ</Label>
              <Input
                value={settings.companyCnpj}
                onChange={(e) => update({ companyCnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
                className="mt-1 h-10 md:h-9"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input
                  value={settings.companyEmail}
                  onChange={(e) => update({ companyEmail: e.target.value })}
                  placeholder="contato@empresa.com"
                  className="mt-1 h-10 md:h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Telefone</Label>
                <Input
                  value={settings.companyPhone}
                  onChange={(e) => update({ companyPhone: e.target.value })}
                  placeholder="(11) 99999-0000"
                  className="mt-1 h-10 md:h-9"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Website</Label>
              <Input
                value={settings.companyWebsite}
                onChange={(e) => update({ companyWebsite: e.target.value })}
                placeholder="https://www.empresa.com"
                className="mt-1 h-10 md:h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Endereço</Label>
              <Input
                value={settings.companyAddress}
                onChange={(e) => update({ companyAddress: e.target.value })}
                placeholder="Endereço completo"
                className="mt-1 h-10 md:h-9"
              />
            </div>
          </div>
        </section>

        {/* Logo */}
        <section className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Logo da Empresa</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Faça upload uma vez. O logo será inserido automaticamente nos templates.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          {settings.logoUrl ? (
            <div className="flex items-start gap-4">
              <div className="relative w-20 overflow-hidden rounded-lg border border-border bg-accent/30">
                <img src={settings.logoUrl} alt="Logo" className="w-full object-contain" style={{ height: 'auto' }} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-6 w-6 rounded-full bg-card/80 p-0"
                  onClick={() => update({ logoUrl: '', logoWidth: undefined, logoHeight: undefined, logoAspectRatio: undefined })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Button variant="outline" size="sm" className="h-9 md:h-8" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Substituir
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="h-9 md:h-8" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Enviar Logo
            </Button>
          )}
        </section>

        {/* Taxa de Imposto */}
        <section className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Taxa de Imposto Padrão</h2>
          <div>
            <Label className="text-xs text-muted-foreground">Taxa (%)</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                step="0.01"
                value={decimalToPercent(settings.defaultTaxRate)}
                onChange={(e) => update({ defaultTaxRate: percentToDecimal(parseFloat(e.target.value) || 0) })}
                className="max-w-xs h-10 md:h-9"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Ex: 10 = 10%, 11.29 = 11,29%
            </p>
          </div>
        </section>

        {/* Nome do PDF */}
        <section className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Nome Padrão do PDF</h2>
          <div>
            <Label className="text-xs text-muted-foreground">Nome base</Label>
            <Input
              value={settings.pdfBaseName}
              onChange={(e) => update({ pdfBaseName: e.target.value })}
              placeholder="Ex: Orçamento PlayPort"
              className="mt-1 h-10 md:h-9"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              O sistema adiciona numeração automática: {settings.pdfBaseName || 'Orçamento'} 001.pdf, {settings.pdfBaseName || 'Orçamento'} 002.pdf...
            </p>
          </div>
        </section>

        {/* Restaurar Templates */}
        <section className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Templates</h2>
          <Button variant="outline" size="sm" className="h-9 md:h-8" onClick={handleRestore}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Restaurar Templates Padrão
          </Button>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Recria os templates originais do sistema.
          </p>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
