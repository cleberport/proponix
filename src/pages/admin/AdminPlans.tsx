import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPlans() {
  return (
    <AdminLayout title="Planos & Billing" description="Gestão de planos e assinaturas">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { name: 'Free', desc: 'Trial de 30 dias', color: 'border-muted-foreground/20' },
          { name: 'Pro', desc: 'Funcionalidades completas', color: 'border-emerald-500/30' },
          { name: 'Premium', desc: 'Links rastreáveis + analytics', color: 'border-violet-500/30' },
        ].map(plan => (
          <Card key={plan.name} className={`${plan.color} border-2`}>
            <CardHeader>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{plan.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground mt-6">
        A gestão de planos é feita diretamente pela alteração de status dos usuários ou via integração Stripe.
      </p>
    </AdminLayout>
  );
}
