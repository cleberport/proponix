import { Table2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SpreadsheetView from '@/components/financas/SpreadsheetView';
import { useFinance } from '@/contexts/FinanceContext';
import { useIsMobile } from '@/hooks/use-mobile';
import FeatureGate from '@/components/FeatureGate';

export default function Financas() {
  const isMobile = useIsMobile();
  const {
    folders, tables, selectedTableId, setSelectedTableId,
    loading, createFolder, createTable, updateTable,
  } = useFinance();

  const selectedTable = tables.find(t => t.id === selectedTableId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Mobile layout with dropdown selector
  if (isMobile) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] pb-16">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          {folders.length > 0 ? (
            <Select value={selectedTableId || ''} onValueChange={id => setSelectedTableId(id)}>
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

  // Desktop: no left panel, folders are in sidebar
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {selectedTable ? (
        <SpreadsheetView table={selectedTable} onUpdate={updateTable} />
      ) : (
        <EmptyState onCreateFolder={() => createFolder('Nova Pasta')} hasFolders={folders.length > 0} />
      )}
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
