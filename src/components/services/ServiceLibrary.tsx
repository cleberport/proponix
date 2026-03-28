import { useState } from 'react';
import { useServices, Service } from '@/hooks/useServices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/calculations';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ServiceLibrary = ({ open, onOpenChange }: Props) => {
  const { services, loading, addService, updateService, deleteService } = useServices();
  const [editing, setEditing] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', notes: '' });

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', notes: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    const priceNum = parseFloat(form.price.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;

    if (editing) {
      await updateService(editing.id, { name: form.name, description: form.description, price: priceNum, notes: form.notes });
      toast.success('Serviço atualizado');
    } else {
      await addService({ name: form.name, description: form.description, price: priceNum, notes: form.notes });
      toast.success('Serviço criado');
    }
    resetForm();
  };

  const handleEdit = (s: Service) => {
    setForm({ name: s.name, description: s.description, price: s.price.toString(), notes: s.notes });
    setEditing(s);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteService(id);
    toast.success('Serviço excluído');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Biblioteca de Serviços
          </DialogTitle>
        </DialogHeader>

        {showForm ? (
          <div className="flex flex-col gap-3 py-2">
            <div>
              <Label className="text-xs font-medium">Nome *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Fotografia de Evento" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium">Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição do serviço..." className="mt-1 min-h-[60px]" />
            </div>
            <div>
              <Label className="text-xs font-medium">Preço</Label>
              <Input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="R$ 1.000,00" inputMode="numeric" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium">Observações</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas adicionais..." className="mt-1 min-h-[40px]" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={resetForm}>Cancelar</Button>
              <Button className="flex-1" onClick={handleSave}>{editing ? 'Atualizar' : 'Criar'}</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0 py-2">
            <Button variant="outline" className="w-full justify-start gap-2 shrink-0" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Novo Serviço
            </Button>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : services.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum serviço cadastrado</p>
            ) : (
              services.map(s => (
                <div key={s.id} className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-accent/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                    {s.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.description}</p>}
                    <p className="text-sm font-bold text-primary mt-1">{formatCurrency(s.price.toString())}</p>
                    {s.notes && <p className="text-[10px] text-muted-foreground mt-0.5 italic">{s.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ServiceLibrary;
