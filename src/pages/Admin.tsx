import { useEffect, useState, useMemo } from 'react';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, UserCheck, Clock, UserX, Search, Pencil, Trash2, Eye, Mail, FileText } from 'lucide-react';
import { toast } from 'sonner';
import AdminEmailsSection from '@/components/admin/AdminEmailsSection';
import AdminEmailLogs from '@/components/admin/AdminEmailLogs';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  status: string;
  trial_start: string;
  trial_end: string;
  created_at: string;
}

interface Stats {
  total: number;
  active: number;
  trial: number;
  expired: number;
}

const statusLabels: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  premium: 'Premium',
  expired: 'Expirado',
};

const statusColors: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  pro: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  premium: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const formatDate = (d: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const AdminPage = () => {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, trial: 0, expired: 0 });
  const [search, setSearch] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', status: '', trial_end: '' });
  const [viewProfile, setViewProfile] = useState<Profile | null>(null);
  const [deleteProfile, setDeleteProfile] = useState<Profile | null>(null);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [profilesRes, statsRes] = await Promise.all([
        supabase.rpc('admin_get_all_profiles'),
        supabase.rpc('admin_get_stats'),
      ]);
      if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
      if (statsRes.data) setStats(statsRes.data as unknown as Stats);
    } catch {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    if (!search.trim()) return profiles;
    const q = search.toLowerCase();
    return profiles.filter(
      (p) => p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    );
  }, [profiles, search]);

  const openEdit = (p: Profile) => {
    setEditProfile(p);
    setEditForm({
      full_name: p.full_name,
      email: p.email,
      status: p.status,
      trial_end: p.trial_end ? new Date(p.trial_end).toISOString().slice(0, 10) : '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editProfile) return;
    const { error } = await supabase.rpc('admin_update_profile', {
      _profile_user_id: editProfile.user_id,
      _full_name: editForm.full_name,
      _email: editForm.email,
      _status: editForm.status,
      _trial_end: new Date(editForm.trial_end).toISOString(),
    });
    if (error) {
      toast.error('Erro ao atualizar: ' + error.message);
    } else {
      toast.success('Usuário atualizado');
      setEditProfile(null);
      fetchData();
    }
  };

  const handleDelete = async () => {
    if (!deleteProfile) return;
    const { data, error } = await supabase.functions.invoke('admin-delete-user', {
      body: { user_id: deleteProfile.user_id },
    });
    if (error) {
      toast.error('Erro ao apagar: ' + (error.message || 'Erro desconhecido'));
    } else if (data?.error) {
      toast.error('Erro ao apagar: ' + data.error);
    } else {
      toast.success('Usuário apagado completamente (dados + conta)');
      setDeleteProfile(null);
      fetchData();
    }
  };

  if (adminLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const statCards = [
    { label: 'Total de Usuários', value: stats.total, icon: Users, color: 'text-foreground' },
    { label: 'Free', value: profiles.filter(p => p.status === 'free').length, icon: UserCheck, color: 'text-muted-foreground' },
    { label: 'Pro', value: profiles.filter(p => p.status === 'pro').length, icon: UserCheck, color: 'text-emerald-600' },
    { label: 'Premium', value: profiles.filter(p => p.status === 'premium').length, icon: UserCheck, color: 'text-violet-600' },
    { label: 'Expirados', value: stats.expired, icon: UserX, color: 'text-red-600' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground md:text-2xl">Painel Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerenciamento de usuários e sistema</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-5 w-full grid grid-cols-3">
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="emails" className="gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {statCards.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Início Trial</TableHead>
                    <TableHead className="hidden md:table-cell">Fim Trial</TableHead>
                    <TableHead className="hidden lg:table-cell">Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingData ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.full_name || '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{p.email}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[p.status] || ''}`}>
                            {statusLabels[p.status] || p.status}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {formatDate(p.trial_start)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {formatDate(p.trial_end)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {formatDate(p.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewProfile(p)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteProfile(p)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="emails">
          <AdminEmailsSection />
        </TabsContent>
      </Tabs>

      {/* View dialog */}
      <Dialog open={!!viewProfile} onOpenChange={() => setViewProfile(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>Informações completas da conta</DialogDescription>
          </DialogHeader>
          {viewProfile && (
            <div className="flex flex-col gap-3 text-sm">
              <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{viewProfile.full_name || '—'}</span></div>
              <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{viewProfile.email}</span></div>
              <div><span className="text-muted-foreground">Status:</span>{' '}
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[viewProfile.status]}`}>
                  {statusLabels[viewProfile.status]}
                </span>
              </div>
              <div><span className="text-muted-foreground">Início Trial:</span> <span className="font-medium">{formatDate(viewProfile.trial_start)}</span></div>
              <div><span className="text-muted-foreground">Fim Trial:</span> <span className="font-medium">{formatDate(viewProfile.trial_end)}</span></div>
              <div><span className="text-muted-foreground">Criado em:</span> <span className="font-medium">{formatDate(viewProfile.created_at)}</span></div>
              <div><span className="text-muted-foreground">User ID:</span> <span className="font-mono text-xs">{viewProfile.user_id}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editProfile} onOpenChange={() => setEditProfile(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Altere os dados do usuário</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className="mt-1 h-10" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="mt-1 h-10" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger className="mt-1 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Data Fim do Trial</Label>
              <Input type="date" value={editForm.trial_end} onChange={(e) => setEditForm({ ...editForm, trial_end: e.target.value })} className="mt-1 h-10" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProfile(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteProfile} onOpenChange={() => setDeleteProfile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja realmente apagar este usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteProfile && `${deleteProfile.full_name || deleteProfile.email} será removido permanentemente.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPage;
