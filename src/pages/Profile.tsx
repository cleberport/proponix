import { getSettings } from '@/lib/templateStorage';
import { decimalToPercent } from '@/lib/calculations';
import { User, Building2, Mail, Phone, Globe, MapPin } from 'lucide-react';

const Profile = () => {
  const settings = getSettings();

  const infoItems = [
    { label: 'CNPJ', value: settings.companyCnpj, icon: Building2 },
    { label: 'Email', value: settings.companyEmail, icon: Mail },
    { label: 'Telefone', value: settings.companyPhone, icon: Phone },
    { label: 'Website', value: settings.companyWebsite, icon: Globe },
    { label: 'Endereço', value: settings.companyAddress, icon: MapPin },
  ].filter(i => i.value);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-foreground mb-6 md:text-2xl">Perfil</h1>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent overflow-hidden shrink-0">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <User className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground truncate">{settings.profileName || 'Não configurado'}</h2>
            <p className="text-sm text-muted-foreground truncate">{settings.companyName || 'Sem empresa'}</p>
          </div>
        </div>

        {infoItems.length > 0 && (
          <div className="flex flex-col gap-3">
            {infoItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3 text-sm">
                <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground w-20 shrink-0">{item.label}</span>
                <span className="text-foreground truncate">{item.value}</span>
              </div>
            ))}
            <div className="flex items-center gap-3 text-sm pt-2 border-t border-border">
              <span className="text-muted-foreground">Imposto padrão</span>
              <span className="ml-auto text-foreground font-medium">{decimalToPercent(settings.defaultTaxRate).toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
