import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('services' as any)
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setServices(data as unknown as Service[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addService = async (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data, error } = await supabase
      .from('services' as any)
      .insert({ ...service, user_id: session.user.id } as any)
      .select()
      .single();

    if (error) { toast.error('Erro ao salvar serviço'); return null; }
    const newService = data as unknown as Service;
    setServices(prev => [newService, ...prev]);
    return newService;
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    const { error } = await supabase
      .from('services' as any)
      .update(updates as any)
      .eq('id', id);

    if (error) { toast.error('Erro ao atualizar serviço'); return; }
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase
      .from('services' as any)
      .delete()
      .eq('id', id);

    if (error) { toast.error('Erro ao excluir serviço'); return; }
    setServices(prev => prev.filter(s => s.id !== id));
  };

  return { services, loading, addService, updateService, deleteService, reload: load };
}
