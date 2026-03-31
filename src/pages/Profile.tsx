import { useState, useEffect } from 'react';
import { getSettings, loadSettingsFromServer, AppSettings } from '@/lib/templateStorage';
import { User, Building2, Mail, Phone, Globe, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

const Profile = () => {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    loadSettingsFromServer().then(setSettings);

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const email = data.user.email || '';
        const name = data.user.user_metadata?.full_name || email.split('@')[0] || '';
        setUserName(name);
        setUserEmail(email);

        if (email) {
          setAvatarUrl(`https://www.gravatar.com/avatar/${simpleHash(email.trim().toLowerCase())}?d=404&s=160`);
        }
      }
    });
  }, []);

  const displayName = settings.profileName || userName || 'Não configurado';

  const infoItems = [
    { label: 'CNPJ', value: settings.companyCnpj, icon: Building2 },
    { label: 'Email', value: settings.companyEmail || userEmail, icon: Mail },
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
            {avatarUrl && !imgError ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" onError={() => setImgError(true)} />
            ) : (
              <User className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground truncate">{displayName}</h2>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
