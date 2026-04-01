import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSettings() {
  return (
    <AdminLayout title="Configurações" description="Configurações gerais do sistema">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            As configurações globais do sistema são gerenciadas via banco de dados e variáveis de ambiente.
          </p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
