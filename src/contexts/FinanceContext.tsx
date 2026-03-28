import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { FinanceFolderData, FinanceTableData } from '@/types/finance';

interface FinanceContextType {
  folders: FinanceFolderData[];
  tables: FinanceTableData[];
  selectedTableId: string | null;
  setSelectedTableId: (id: string | null) => void;
  loading: boolean;
  createFolder: (name: string) => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  createTable: (folderId: string, name: string) => Promise<void>;
  renameTable: (id: string, name: string) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  updateTable: (updates: Partial<FinanceTableData>) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [folders, setFolders] = useState<FinanceFolderData[]>([]);
  const [tables, setTables] = useState<FinanceTableData[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const pendingUpdatesRef = useRef<Record<string, Partial<FinanceTableData>>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      const [fRes, tRes] = await Promise.all([
        supabase.from('finance_folders').select('*').eq('user_id', userId).order('position'),
        supabase.from('finance_tables').select('*').eq('user_id', userId).order('position'),
      ]);
      if (fRes.data) setFolders(fRes.data as unknown as FinanceFolderData[]);
      if (tRes.data) setTables(tRes.data as unknown as FinanceTableData[]);
      setLoading(false);
    };
    load();
  }, [userId]);

  // Flush pending saves on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      // Flush any remaining
      Object.entries(pendingUpdatesRef.current).forEach(([id, data]) => {
        supabase.from('finance_tables').update(data as any).eq('id', id).then();
      });
    };
  }, []);

  const createFolder = useCallback(async (name: string) => {
    if (!userId) return;
    const { data, error } = await supabase.from('finance_folders')
      .insert({ user_id: userId, name, position: folders.length })
      .select().single();
    if (error) { toast.error('Erro ao criar pasta'); return; }
    setFolders(prev => [...prev, data as unknown as FinanceFolderData]);
  }, [userId, folders.length]);

  const renameFolder = useCallback(async (id: string, name: string) => {
    const { error } = await supabase.from('finance_folders').update({ name }).eq('id', id);
    if (error) { toast.error('Erro ao renomear'); return; }
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    const { error } = await supabase.from('finance_folders').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir pasta'); return; }
    setFolders(prev => prev.filter(f => f.id !== id));
    setTables(prev => {
      const remaining = prev.filter(t => t.folder_id !== id);
      return remaining;
    });
    setSelectedTableId(prev => {
      const affectedTable = tables.find(t => t.folder_id === id && t.id === prev);
      return affectedTable ? null : prev;
    });
  }, [tables]);

  const createTable = useCallback(async (folderId: string, name: string) => {
    if (!userId) return;
    const { data, error } = await supabase.from('finance_tables').insert({
      user_id: userId,
      folder_id: folderId,
      name,
      columns: [],
      rows: [],
      position: tables.filter(t => t.folder_id === folderId).length,
    }).select().single();
    if (error) { toast.error('Erro ao criar tabela'); return; }
    const newTable = data as unknown as FinanceTableData;
    setTables(prev => [...prev, newTable]);
    setSelectedTableId(newTable.id);
  }, [userId, tables]);

  const renameTable = useCallback(async (id: string, name: string) => {
    const { error } = await supabase.from('finance_tables').update({ name }).eq('id', id);
    if (error) { toast.error('Erro ao renomear'); return; }
    setTables(prev => prev.map(t => t.id === id ? { ...t, name } : t));
  }, []);

  const deleteTable = useCallback(async (id: string) => {
    const { error } = await supabase.from('finance_tables').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir tabela'); return; }
    setTables(prev => prev.filter(t => t.id !== id));
    if (selectedTableId === id) setSelectedTableId(null);
  }, [selectedTableId]);

  const updateTable = useCallback((updates: Partial<FinanceTableData>) => {
    if (!selectedTableId) return;
    // Optimistic update
    setTables(prev => prev.map(t => t.id === selectedTableId ? { ...t, ...updates } : t));
    // Merge pending
    pendingUpdatesRef.current[selectedTableId] = {
      ...pendingUpdatesRef.current[selectedTableId],
      ...updates,
    };
    const id = selectedTableId;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const pending = pendingUpdatesRef.current[id];
      if (!pending) return;
      delete pendingUpdatesRef.current[id];
      const { error } = await supabase.from('finance_tables').update(pending as any).eq('id', id);
      if (error) toast.error('Erro ao salvar');
    }, 800);
  }, [selectedTableId]);

  return (
    <FinanceContext.Provider value={{
      folders, tables, selectedTableId, setSelectedTableId, loading,
      createFolder, renameFolder, deleteFolder,
      createTable, renameTable, deleteTable, updateTable,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}
