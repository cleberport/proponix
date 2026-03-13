import { getSettings } from '@/lib/templateStorage';
import { User } from 'lucide-react';

const Profile = () => {
  const settings = getSettings();

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-foreground md:text-2xl">Profile</h1>
        <p className="text-sm text-muted-foreground">Your profile information</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-full w-full rounded-full object-contain" />
            ) : (
              <User className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{settings.profileName || 'Not set'}</h2>
            <p className="text-sm text-muted-foreground">{settings.companyName || 'No company'}</p>
          </div>
        </div>

        <div className="grid gap-4 text-sm">
          {settings.companyEmail && (
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground">{settings.companyEmail}</span>
            </div>
          )}
          {settings.companyPhone && (
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Phone</span>
              <span className="text-foreground">{settings.companyPhone}</span>
            </div>
          )}
          {settings.companyAddress && (
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Address</span>
              <span className="text-foreground">{settings.companyAddress}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Default Tax Rate</span>
            <span className="text-foreground">{(settings.defaultTaxRate * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
