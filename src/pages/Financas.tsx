import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Table2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FolderPanel from '@/components/financas/FolderPanel';
import SpreadsheetView from '@/components/financas/SpreadsheetView';
import type { FinanceFolderData, FinanceTableData } from '@/types/finance';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Financas() {
  const isMobile = useIsMobile();
  const [folders, setFolders] = useState<FinanceFolderData[]>([]);
  const [tables, setTables] = useState<FinanceTableData[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Load data
  useEffect(() => {
    if (!userId) return;
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

  // CRUD Folders
  const createFolder = async (name: string) => {
    if (!userId) return;
    const { data, error } = await supabase.from('finance_folders').insert({ user_id: userId, name, position: folders.length }).select().single();
    if (error) { toast.error('Erro ao criar pasta'); return; }
    setFolders(prev => [...prev, data as unknown as FinanceFolderData]);
  };

  const renameFolder = async (id: string, name: string) => {
    const { error } = await supabase.from('finance_folders').update({ name }).eq('id', id);
    if (error) { toast.error('Erro ao renomear'); return; }
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
  };

  const deleteFolder = async (id: string) => {
    const { error } = await supabase.from('finance_folders').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir pasta'); return; }
    setFolders(prev => prev.filter(f => f.id !== id));
    setTables(prev => prev.filter(t => t.folder_id !== id));
    if (tables.find(t => t.folder_id === id && t.id === selectedTableId)) setSelectedTableId(null);
  };

  // CRUD Tables
  const createTable = async (folderId: string, name: string) => {
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
  };

  const renameTable = async (id: string, name: string) => {
    const { error } = await supabase.from('finance_tables').update({ name }).eq('id', id);
    if (error) { toast.error('Erro ao renomear'); return; }
    setTables(prev => prev.map(t => t.id === id ? { ...t, name } : t));
  };

  const deleteTable = async (id: string) => {
    const { error } = await supabase.from('finance_tables').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir tabela'); return; }
    setTables(prev => prev.filter(t => t.id !== id));
    if (selectedTableId === id) setSelectedTableId(null);
  };

  // Update table data (columns/rows)
  const updateTable = useCallback(async (updates: Partial<FinanceTableData>) => {
    if (!selectedTableId) return;
    // Optimistic update
    setTables(prev => prev.map(t => t.id === selectedTableId ? { ...t, ...updates } : t));
    // Persist
    const { error } = await supabase.from('finance_tables').update(updates as any).eq('id', selectedTableId);
    if (error) toast.error('Erro ao salvar');
  }, [selectedTableId]);

  const selectedTable = tables.find(t => t.id === selectedTableId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] pb-16">
        {/* Mobile selector */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          {folders.length > 0 ? (
            <>
              <Select
                value={selectedTableId || ''}
                onValueChange={id => setSelectedTableId(id)}
              >
                <SelectTrigger className="flex-1 h-9">
                  <SelectValue placeholder="Selecione uma tabela" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map(folder => {
                    const folderTables = tables.filter(t => t.folder_id === folder.id);
                    return folderTables.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {folder.name} / {t.name}
                      </SelectItem>
                    ));
                  })}
                </SelectContent>
              </Select>
            </>
          ) : (
            <Button variant="outline" size="sm" className="w-full" onClick={() => createFolder('Nova Pasta')}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Criar Pasta
            </Button>
          )}
        </div>

        {selectedTable ? (
          <SpreadsheetView table={selectedTable} onUpdate={updateTable} />
        ) : (
          <EmptyState onCreateFolder={() => createFolder('Nova Pasta')} hasFolders={folders.length > 0} />
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left panel */}
      <div className="w-60 shrink-0 border-r border-border/50 bg-background">
        <FolderPanel
          folders={folders}
          tables={tables}
          selectedTableId={selectedTableId}
          onSelectTable={setSelectedTableId}
          onCreateFolder={createFolder}
          onRenameFolder={renameFolder}
          onDeleteFolder={deleteFolder}
          onCreateTable={createTable}
          onRenameTable={renameTable}
          onDeleteTable={deleteTable}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 min-w-0">
        {selectedTable ? (
          <SpreadsheetView table={selectedTable} onUpdate={updateTable} />
        ) : (
          <EmptyState onCreateFolder={() => createFolder('Nova Pasta')} hasFolders={folders.length > 0} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ onCreateFolder, hasFolders }: { onCreateFolder: () => void; hasFolders: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <Table2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {hasFolders ? 'Selecione uma tabela' : 'Comece criando uma pasta'}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        {hasFolders
          ? 'Escolha uma tabela no painel lateral para visualizar e editar seus dados financeiros.'
          : 'Organize suas finanças em pastas e tabelas. Crie sua primeira pasta para começar.'}
      </p>
      {!hasFolders && (
        <Button onClick={onCreateFolder}>
          <Plus className="h-4 w-4 mr-1.5" /> Nova Pasta
        </Button>
      )}
    </div>
  );
}
