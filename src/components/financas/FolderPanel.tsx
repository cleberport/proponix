import { useState } from 'react';
import { ChevronRight, ChevronDown, FolderOpen, Table2, Plus, MoreHorizontal, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { FinanceFolderData, FinanceTableData } from '@/types/finance';

interface Props {
  folders: FinanceFolderData[];
  tables: FinanceTableData[];
  selectedTableId: string | null;
  onSelectTable: (tableId: string) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onCreateTable: (folderId: string, name: string) => void;
  onRenameTable: (id: string, name: string) => void;
  onDeleteTable: (id: string) => void;
}

export default function FolderPanel({
  folders, tables, selectedTableId,
  onSelectTable, onCreateFolder, onRenameFolder, onDeleteFolder,
  onCreateTable, onRenameTable, onDeleteTable,
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newFolderName, setNewFolderName] = useState('');
  const [addingFolder, setAddingFolder] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [addingTableFor, setAddingTableFor] = useState<string | null>(null);
  const [newTableName, setNewTableName] = useState('');

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const submitRename = (type: 'folder' | 'table') => {
    if (!editingId || !editName.trim()) { setEditingId(null); return; }
    if (type === 'folder') onRenameFolder(editingId, editName.trim());
    else onRenameTable(editingId, editName.trim());
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-3 border-b border-border/50">
        <h2 className="text-sm font-semibold text-foreground">Pastas</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAddingFolder(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-1 py-2 space-y-0.5">
        {addingFolder && (
          <div className="px-2 py-1">
            <Input
              autoFocus
              placeholder="Nome da pasta"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newFolderName.trim()) {
                  onCreateFolder(newFolderName.trim());
                  setNewFolderName('');
                  setAddingFolder(false);
                }
                if (e.key === 'Escape') setAddingFolder(false);
              }}
              onBlur={() => { setAddingFolder(false); setNewFolderName(''); }}
              className="h-8 text-sm"
            />
          </div>
        )}

        {folders.map(folder => {
          const isOpen = expanded[folder.id] !== false;
          const folderTables = tables.filter(t => t.folder_id === folder.id);

          return (
            <div key={folder.id}>
              <div className="group flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer">
                <button onClick={() => toggle(folder.id)} className="shrink-0">
                  {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
                <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />

                {editingId === folder.id ? (
                  <Input
                    autoFocus value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') submitRename('folder'); if (e.key === 'Escape') setEditingId(null); }}
                    onBlur={() => submitRename('folder')}
                    className="h-6 text-sm flex-1 py-0"
                  />
                ) : (
                  <span className="text-sm text-foreground truncate flex-1" onClick={() => toggle(folder.id)}>{folder.name}</span>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => setAddingTableFor(folder.id)}>
                      <Plus className="h-3.5 w-3.5 mr-2" /> Nova Tabela
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => startRename(folder.id, folder.name)}>
                      <Pencil className="h-3.5 w-3.5 mr-2" /> Renomear
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => onDeleteFolder(folder.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {isOpen && (
                <div className="ml-5 space-y-0.5">
                  {addingTableFor === folder.id && (
                    <div className="px-2 py-1">
                      <Input
                        autoFocus placeholder="Nome da tabela"
                        value={newTableName}
                        onChange={e => setNewTableName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newTableName.trim()) {
                            onCreateTable(folder.id, newTableName.trim());
                            setNewTableName('');
                            setAddingTableFor(null);
                          }
                          if (e.key === 'Escape') setAddingTableFor(null);
                        }}
                        onBlur={() => { setAddingTableFor(null); setNewTableName(''); }}
                        className="h-7 text-sm"
                      />
                    </div>
                  )}

                  {folderTables.map(table => (
                    <div
                      key={table.id}
                      className={cn(
                        'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
                        selectedTableId === table.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50 text-foreground/80'
                      )}
                      onClick={() => onSelectTable(table.id)}
                    >
                      <Table2 className="h-3.5 w-3.5 shrink-0" />
                      {editingId === table.id ? (
                        <Input
                          autoFocus value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') submitRename('table'); if (e.key === 'Escape') setEditingId(null); }}
                          onBlur={() => submitRename('table')}
                          className="h-6 text-sm flex-1 py-0"
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-sm truncate flex-1">{table.name}</span>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => startRename(table.id, table.name)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" /> Renomear
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => onDeleteTable(table.id)}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}

                  {folderTables.length === 0 && !addingTableFor && (
                    <button
                      onClick={() => setAddingTableFor(folder.id)}
                      className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Criar tabela
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {folders.length === 0 && !addingFolder && (
          <div className="text-center py-8 px-4">
            <FolderOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Nenhuma pasta ainda</p>
            <Button variant="outline" size="sm" onClick={() => setAddingFolder(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Nova Pasta
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
