import { getSettings } from '@/lib/templateStorage';
import { decimalToPercent } from '@/lib/calculations';
import { User } from 'lucide-react';

const Profile = () => {
  const settings = getSettings();

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-foreground md:text-2xl">Perfil</h1>
        <p className="text-sm text-muted-foreground">Informações do seu perfil e empresa</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent overflow-hidden">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <User className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{settings.profileName || 'Não configurado'}</h2>
            <p className="text-sm text-muted-foreground">{settings.companyName || 'Sem empresa'}</p>
          </div>
        </div>

        <div className="grid gap-4 text-sm">
          {settings.companyCnpj && (
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">CNPJ</span>
              <span className="text-foreground">{settings.companyCnpj}</span>
            </div>
          )}
          {settings.companyEmail && (
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground">{settings.companyEmail}</span>
            </div>
          )}
          {settings.companyPhone && (
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Telefone</span>
              <span className="text-foreground">{settings.companyPhone}</span>
            </div>
          )}
          {settings.companyWebsite && (
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Website</span>
              <span className="text-foreground">{settings.companyWebsite}</span>
            </div>
          )}
          {settings.companyAddress && (
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Endereço</span>
              <span className="text-foreground">{settings.companyAddress}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxa de Imposto Padrão</span>
            <span className="text-foreground">{decimalToPercent(settings.defaultTaxRate).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
