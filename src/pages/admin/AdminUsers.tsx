import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Search, Pencil, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

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

const statusLabels: Record<string, string> = {
  free: 'Free', pro: 'Pro', premium: 'Premium', expired: 'Expirado',
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

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', status: '', trial_end: '' });
  const [viewProfile, setViewProfile] = useState<Profile | null>(null);
  const [deleteProfile, setDeleteProfile] = useState<Profile | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('admin_get_all_profiles');
    if (data) setProfiles(data as Profile[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return profiles;
    const q = search.toLowerCase();
    return profiles.filter(p => p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
  }, [profiles, search]);

  const openEdit = (p: Profile) => {
    setEditProfile(p);
    setEditForm({
      full_name: p.full_name, email: p.email, status: p.status,
      trial_end: p.trial_end ? new Date(p.trial_end).toISOString().slice(0, 10) : '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editProfile) return;
    const { error } = await supabase.rpc('admin_update_profile', {
      _profile_user_id: editProfile.user_id, _full_name: editForm.full_name,
      _email: editForm.email, _status: editForm.status,
      _trial_end: new Date(editForm.trial_end).toISOString(),
    });
    if (error) toast.error('Erro: ' + error.message);
    else { toast.success('Usuário atualizado'); setEditProfile(null); fetchData(); }
  };

  const handleDelete = async () => {
    if (!deleteProfile) return;
    const { data, error } = await supabase.functions.invoke('admin-delete-user', {
      body: { user_id: deleteProfile.user_id },
    });
    if (error || data?.error) toast.error('Erro ao apagar');
    else { toast.success('Usuário apagado'); setDeleteProfile(null); fetchData(); }
  };

  return (
    <AdminLayout title="Usuários" description="Gerenciamento de contas">
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
      </div>

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
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Nenhum usuário encontrado</TableCell></TableRow>
              ) : filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{p.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[p.status] || ''}`}>
                      {statusLabels[p.status] || p.status}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{formatDate(p.trial_start)}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{formatDate(p.trial_end)}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{formatDate(p.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewProfile(p)}><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteProfile(p)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* View dialog */}
      <Dialog open={!!viewProfile} onOpenChange={() => setViewProfile(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Detalhes do Usuário</DialogTitle><DialogDescription>Informações da conta</DialogDescription></DialogHeader>
          {viewProfile && (
            <div className="flex flex-col gap-3 text-sm">
              <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{viewProfile.full_name || '—'}</span></div>
              <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{viewProfile.email}</span></div>
              <div><span className="text-muted-foreground">Status:</span>{' '}
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[viewProfile.status]}`}>
                  {statusLabels[viewProfile.status]}
                </span>
              </div>
              <div><span className="text-muted-foreground">User ID:</span> <span className="font-mono text-xs">{viewProfile.user_id}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editProfile} onOpenChange={() => setEditProfile(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Usuário</DialogTitle><DialogDescription>Altere os dados</DialogDescription></DialogHeader>
          <div className="flex flex-col gap-4">
            <div><Label className="text-xs text-muted-foreground">Nome</Label><Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className="mt-1 h-10" /></div>
            <div><Label className="text-xs text-muted-foreground">Email</Label><Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="mt-1 h-10" /></div>
            <div><Label className="text-xs text-muted-foreground">Status</Label>
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
            <div><Label className="text-xs text-muted-foreground">Fim do Trial</Label><Input type="date" value={editForm.trial_end} onChange={(e) => setEditForm({ ...editForm, trial_end: e.target.value })} className="mt-1 h-10" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProfile(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteProfile} onOpenChange={() => setDeleteProfile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar este usuário?</AlertDialogTitle>
            <AlertDialogDescription>{deleteProfile && `${deleteProfile.full_name || deleteProfile.email} será removido permanentemente.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
