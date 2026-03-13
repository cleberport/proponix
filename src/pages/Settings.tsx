import { useState } from 'react';
import { getSettings, saveSettings, AppSettings } from '@/lib/templateStorage';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Save, Upload, X, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { useRef } from 'react';

const SettingsPage = () => {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const handleSave = () => {
    saveSettings(settings);
    // Apply theme
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    toast.success('Settings saved');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      update({ logoUrl: ev.target?.result as string });
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

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
        </div>
        <Button size="sm" onClick={handleSave}>
          <Save className="mr-1.5 h-3.5 w-3.5" />
          Save
        </Button>
      </div>

      <div className="flex flex-col gap-8">
        {/* Theme */}
        <section className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Appearance</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.theme === 'dark' ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </p>
                <p className="text-xs text-muted-foreground">Switch between light and dark theme</p>
              </div>
            </div>
            <Switch checked={settings.theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
        </section>

        {/* Profile */}
        <section className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Profile</h2>
          <div className="flex flex-col gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input
                value={settings.profileName}
                onChange={(e) => update({ profileName: e.target.value })}
                placeholder="Your name"
                className="mt-1"
              />
            </div>
          </div>
        </section>

        {/* Company */}
        <section className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Company Information</h2>
          <div className="flex flex-col gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Company Name</Label>
              <Input
                value={settings.companyName}
                onChange={(e) => update({ companyName: e.target.value })}
                placeholder="Company name"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input
                  value={settings.companyEmail}
                  onChange={(e) => update({ companyEmail: e.target.value })}
                  placeholder="email@company.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <Input
                  value={settings.companyPhone}
                  onChange={(e) => update({ companyPhone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Address</Label>
              <Input
                value={settings.companyAddress}
                onChange={(e) => update({ companyAddress: e.target.value })}
                placeholder="Company address"
                className="mt-1"
              />
            </div>
          </div>
        </section>

        {/* Logo */}
        <section className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Company Logo</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          {settings.logoUrl ? (
            <div className="flex items-start gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-accent/30">
                <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-5 w-5 rounded-full bg-card/80 p-0"
                  onClick={() => update({ logoUrl: '' })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Replace
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Upload Logo
            </Button>
          )}
        </section>

        {/* Tax */}
        <section className="rounded-lg border border-border bg-card p-4 md:p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Default Tax Rate</h2>
          <div>
            <Label className="text-xs text-muted-foreground">Tax Rate (decimal, e.g. 0.10 = 10%)</Label>
            <Input
              type="number"
              step="0.01"
              value={settings.defaultTaxRate}
              onChange={(e) => update({ defaultTaxRate: parseFloat(e.target.value) || 0 })}
              className="mt-1 max-w-xs"
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
