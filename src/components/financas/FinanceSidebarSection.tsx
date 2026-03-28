import { useState } from 'react';
import { ChevronRight, ChevronDown, FolderOpen, Table2, Plus, MoreHorizontal, Trash2, Pencil, DollarSign } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useFinance } from '@/contexts/FinanceContext';
import { useSidebar } from '@/components/ui/sidebar';

export default function FinanceSidebarSection() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const navigate = useNavigate();
  const location = useLocation();
  const {
    folders, tables, selectedTableId, setSelectedTableId,
    createFolder, renameFolder, deleteFolder,
    createTable, renameTable, deleteTable,
  } = useFinance();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [sectionOpen, setSectionOpen] = useState(location.pathname === '/financas');
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [addingTableFor, setAddingTableFor] = useState<string | null>(null);
  const [newTableName, setNewTableName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const selectTable = (tableId: string) => {
    setSelectedTableId(tableId);
    navigate('/financas');
  };

  const submitRename = (type: 'folder' | 'table') => {
    if (!editingId || !editName.trim()) { setEditingId(null); return; }
    if (type === 'folder') renameFolder(editingId, editName.trim());
    else renameTable(editingId, editName.trim());
    setEditingId(null);
  };

  if (collapsed) {
    return (
      <div className="px-2 py-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn('w-full h-8', location.pathname === '/financas' && 'bg-muted text-primary')}
          onClick={() => navigate('/financas')}
        >
          <DollarSign className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="px-2 py-1">
      {/* Section header */}
      <button
        onClick={() => setSectionOpen(!sectionOpen)}
        className={cn(
          'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-muted/50',
          location.pathname === '/financas' ? 'text-primary' : 'text-foreground'
        )}
      >
        <DollarSign className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Finanças</span>
        {sectionOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>

      {sectionOpen && (
        <div className="ml-2 mt-0.5 space-y-0.5">
          {/* Add folder button */}
          <button
            onClick={() => setAddingFolder(true)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full rounded-md hover:bg-muted/30"
          >
            <Plus className="h-3 w-3" /> Nova Pasta
          </button>

          {addingFolder && (
            <div className="px-1 py-0.5">
              <Input
                autoFocus
                placeholder="Nome da pasta"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newFolderName.trim()) {
                    createFolder(newFolderName.trim());
                    setNewFolderName('');
                    setAddingFolder(false);
                  }
                  if (e.key === 'Escape') setAddingFolder(false);
                }}
                onBlur={() => { setAddingFolder(false); setNewFolderName(''); }}
                className="h-7 text-xs"
              />
            </div>
          )}

          {folders.map(folder => {
            const isOpen = expanded[folder.id] !== false;
            const folderTables = tables.filter(t => t.folder_id === folder.id);

            return (
              <div key={folder.id}>
                <div className="group flex items-center gap-1 px-1 py-1 rounded-md hover:bg-muted/40 cursor-pointer">
                  <button onClick={() => toggle(folder.id)} className="shrink-0">
                    {isOpen ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  </button>
                  <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

                  {editingId === folder.id ? (
                    <Input
                      autoFocus value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') submitRename('folder'); if (e.key === 'Escape') setEditingId(null); }}
                      onBlur={() => submitRename('folder')}
                      className="h-5 text-xs flex-1 py-0 border-0 shadow-none"
                    />
                  ) : (
                    <span className="text-xs text-foreground truncate flex-1" onClick={() => toggle(folder.id)}>{folder.name}</span>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => setAddingTableFor(folder.id)}>
                        <Plus className="h-3 w-3 mr-1.5" /> Nova Tabela
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEditingId(folder.id); setEditName(folder.name); }}>
                        <Pencil className="h-3 w-3 mr-1.5" /> Renomear
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteFolder(folder.id)}>
                        <Trash2 className="h-3 w-3 mr-1.5" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {isOpen && (
                  <div className="ml-4 space-y-0.5">
                    {addingTableFor === folder.id && (
                      <div className="px-1 py-0.5">
                        <Input
                          autoFocus placeholder="Nome da tabela"
                          value={newTableName}
                          onChange={e => setNewTableName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && newTableName.trim()) {
                              createTable(folder.id, newTableName.trim());
                              setNewTableName('');
                              setAddingTableFor(null);
                            }
                            if (e.key === 'Escape') setAddingTableFor(null);
                          }}
                          onBlur={() => { setAddingTableFor(null); setNewTableName(''); }}
                          className="h-6 text-xs"
                        />
                      </div>
                    )}

                    {folderTables.map(table => (
                      <div
                        key={table.id}
                        className={cn(
                          'group/table flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-colors text-xs',
                          selectedTableId === table.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted/40 text-foreground/70'
                        )}
                        onClick={() => selectTable(table.id)}
                      >
                        <Table2 className="h-3 w-3 shrink-0" />
                        {editingId === table.id ? (
                          <Input
                            autoFocus value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') submitRename('table'); if (e.key === 'Escape') setEditingId(null); }}
                            onBlur={() => submitRename('table')}
                            className="h-5 text-xs flex-1 py-0 border-0 shadow-none"
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <span className="truncate flex-1">{table.name}</span>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover/table:opacity-100 shrink-0" onClick={e => e.stopPropagation()}>
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => { setEditingId(table.id); setEditName(table.name); }}>
                              <Pencil className="h-3 w-3 mr-1.5" /> Renomear
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteTable(table.id)}>
                              <Trash2 className="h-3 w-3 mr-1.5" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}

                    {folderTables.length === 0 && addingTableFor !== folder.id && (
                      <button
                        onClick={() => setAddingTableFor(folder.id)}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Plus className="h-2.5 w-2.5" /> Criar tabela
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
