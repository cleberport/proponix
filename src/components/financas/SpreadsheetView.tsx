import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Plus, Trash2, MoreHorizontal, ArrowLeft, ArrowRight,
  Type, Hash, DollarSign, Calendar, CheckSquare, List, FunctionSquare, Pencil,
  ZoomIn, ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { evaluateFinanceFormula, formatBRL, getColumnNumericValue } from '@/lib/financeFormulas';
import type { FinanceColumn, FinanceColumnType, FinanceRow, FinanceTableData, SelectOption } from '@/types/finance';

const TYPE_ICONS: Record<FinanceColumnType, typeof Type> = {
  text: Type, number: Hash, currency: DollarSign,
  date: Calendar, checkbox: CheckSquare, select: List, formula: FunctionSquare,
};

const TYPE_LABELS: Record<FinanceColumnType, string> = {
  text: 'Texto', number: 'Número', currency: 'Moeda (R$)',
  date: 'Data', checkbox: 'Checkbox', select: 'Seleção', formula: 'Fórmula',
};

const SELECT_COLORS = [
  { label: 'Verde', value: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  { label: 'Azul', value: 'bg-blue-500/15 text-blue-700 dark:text-blue-400' },
  { label: 'Amarelo', value: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  { label: 'Vermelho', value: 'bg-red-500/15 text-red-700 dark:text-red-400' },
  { label: 'Roxo', value: 'bg-purple-500/15 text-purple-700 dark:text-purple-400' },
  { label: 'Cinza', value: 'bg-muted text-muted-foreground' },
];

const MIN_COL_WIDTH = 60;
const DEFAULT_COL_WIDTH = 150;

interface Props {
  table: FinanceTableData;
  onUpdate: (updates: Partial<FinanceTableData>) => void;
}

export default function SpreadsheetView({ table, onUpdate }: Props) {
  const { columns, rows } = table;
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddCol, setShowAddCol] = useState(false);
  const [newCol, setNewCol] = useState<Partial<FinanceColumn>>({ name: '', type: 'text' });
  const [newColOptions, setNewColOptions] = useState<SelectOption[]>([{ label: '', color: SELECT_COLORS[0].value }]);
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editColName, setEditColName] = useState('');
  const [zoom, setZoom] = useState(100);
  const inputRef = useRef<HTMLInputElement>(null);

  // Column resize state
  const resizingRef = useRef<{ colId: string; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) inputRef.current.focus();
  }, [editingCell]);

  // Column resize handlers
  const onResizeStart = useCallback((e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const col = columns.find(c => c.id === colId);
    const startWidth = col?.width || DEFAULT_COL_WIDTH;
    resizingRef.current = { colId, startX: e.clientX, startWidth };

    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const diff = ev.clientX - resizingRef.current.startX;
      const newWidth = Math.max(MIN_COL_WIDTH, resizingRef.current.startWidth + diff);
      onUpdate({
        columns: columns.map(c => c.id === colId ? { ...c, width: newWidth } : c),
      });
    };

    const onUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [columns, onUpdate]);

  // Cell editing
  const startEdit = (rowId: string, colId: string, value: any) => {
    const col = columns.find(c => c.id === colId);
    if (col?.type === 'formula' || col?.type === 'checkbox') return;
    setEditingCell({ rowId, colId });
    setEditValue(value?.toString() || '');
  };

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const newRows = rows.map(r =>
      r.id === editingCell.rowId
        ? { ...r, cells: { ...r.cells, [editingCell.colId]: editValue } }
        : r
    );
    onUpdate({ rows: newRows });
    setEditingCell(null);
  }, [editingCell, editValue, rows, onUpdate]);

  const toggleCheckbox = (rowId: string, colId: string) => {
    const newRows = rows.map(r =>
      r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: !r.cells[colId] } } : r
    );
    onUpdate({ rows: newRows });
  };

  const setSelectValue = (rowId: string, colId: string, val: string) => {
    const newRows = rows.map(r =>
      r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: val } } : r
    );
    onUpdate({ rows: newRows });
  };

  // Row operations
  const addRow = () => {
    const newRow: FinanceRow = { id: crypto.randomUUID(), cells: {} };
    onUpdate({ rows: [...rows, newRow] });
  };

  const deleteRow = (id: string) => {
    onUpdate({ rows: rows.filter(r => r.id !== id) });
  };

  // Column operations
  const addColumn = () => {
    if (!newCol.name?.trim()) return;
    const col: FinanceColumn = {
      id: crypto.randomUUID(),
      name: newCol.name.trim(),
      type: newCol.type || 'text',
      width: DEFAULT_COL_WIDTH,
      ...(newCol.type === 'select' ? { options: newColOptions.filter(o => o.label.trim()) } : {}),
      ...(newCol.type === 'formula' ? { formula: newCol.formula || '' } : {}),
    };
    onUpdate({ columns: [...columns, col] });
    setShowAddCol(false);
    setNewCol({ name: '', type: 'text' });
    setNewColOptions([{ label: '', color: SELECT_COLORS[0].value }]);
  };

  const deleteColumn = (id: string) => {
    onUpdate({
      columns: columns.filter(c => c.id !== id),
      rows: rows.map(r => {
        const { [id]: _, ...rest } = r.cells;
        return { ...r, cells: rest };
      }),
    });
  };

  const changeColumnType = (id: string, type: FinanceColumnType) => {
    onUpdate({ columns: columns.map(c => c.id === id ? { ...c, type } : c) });
  };

  const moveColumn = (id: string, dir: -1 | 1) => {
    const idx = columns.findIndex(c => c.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= columns.length) return;
    const newCols = [...columns];
    [newCols[idx], newCols[newIdx]] = [newCols[newIdx], newCols[idx]];
    onUpdate({ columns: newCols });
  };

  const startRenameCol = (id: string, name: string) => {
    setEditingColId(id);
    setEditColName(name);
  };

  const commitRenameCol = () => {
    if (!editingColId || !editColName.trim()) { setEditingColId(null); return; }
    onUpdate({ columns: columns.map(c => c.id === editingColId ? { ...c, name: editColName.trim() } : c) });
    setEditingColId(null);
  };

  // Render cell
  const renderCell = (row: FinanceRow, col: FinanceColumn) => {
    const value = row.cells[col.id];
    const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;

    if (col.type === 'checkbox') {
      return (
        <div className="flex items-center justify-center">
          <Checkbox checked={!!value} onCheckedChange={() => toggleCheckbox(row.id, col.id)} />
        </div>
      );
    }

    if (col.type === 'select') {
      const opts = col.options || [];
      const selected = opts.find(o => o.label === value);
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full text-left px-1 py-0.5 rounded min-h-[28px]">
              {selected ? (
                <Badge variant="secondary" className={cn('text-xs font-normal', selected.color)}>{selected.label}</Badge>
              ) : (
                <span className="text-muted-foreground text-xs">Selecionar...</span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {opts.map(opt => (
              <DropdownMenuItem key={opt.label} onClick={() => setSelectValue(row.id, col.id, opt.label)}>
                <Badge variant="secondary" className={cn('text-xs font-normal', opt.color)}>{opt.label}</Badge>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={() => setSelectValue(row.id, col.id, '')}>
              <span className="text-xs text-muted-foreground">Limpar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    if (col.type === 'formula') {
      const result = evaluateFinanceFormula(col.formula || '', columns, row.cells);
      return <span className="font-medium tabular-nums">{formatBRL(result)}</span>;
    }

    if (isEditing) {
      return (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') setEditingCell(null);
            if (e.key === 'Tab') {
              e.preventDefault();
              commitEdit();
              const colIdx = columns.findIndex(c => c.id === col.id);
              const nextCol = columns.slice(colIdx + 1).find(c => c.type !== 'formula' && c.type !== 'checkbox');
              if (nextCol) {
                setTimeout(() => startEdit(row.id, nextCol.id, row.cells[nextCol.id]), 0);
              }
            }
          }}
          className="h-7 border-0 shadow-none focus-visible:ring-1 px-1 bg-transparent"
          style={{ fontSize: 'inherit' }}
          type={col.type === 'number' || col.type === 'currency' ? 'text' : col.type === 'date' ? 'date' : 'text'}
          inputMode={col.type === 'number' || col.type === 'currency' ? 'decimal' : 'text'}
        />
      );
    }

    let displayValue = value?.toString() || '';
    if (col.type === 'currency' && displayValue) {
      const num = getColumnNumericValue(displayValue);
      if (num !== 0 || displayValue.trim()) displayValue = formatBRL(num);
    }

    return (
      <div
        className="w-full h-full min-h-[28px] px-1 py-0.5 cursor-text flex items-center tabular-nums"
        onClick={() => startEdit(row.id, col.id, value)}
      >
        {displayValue || <span className="text-muted-foreground/40">—</span>}
      </div>
    );
  };

  // Summary row
  const getColumnSum = (col: FinanceColumn): number | null => {
    if (col.type !== 'number' && col.type !== 'currency' && col.type !== 'formula') return null;
    return rows.reduce((sum, row) => {
      if (col.type === 'formula') {
        return sum + evaluateFinanceFormula(col.formula || '', columns, row.cells);
      }
      return sum + getColumnNumericValue(row.cells[col.id]);
    }, 0);
  };

  const Icon = (type: FinanceColumnType) => TYPE_ICONS[type];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 gap-4">
        <h2 className="text-lg font-semibold text-foreground truncate">{table.name}</h2>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:inline">{rows.length} linhas · {columns.length} colunas</span>
          {/* Zoom control */}
          <div className="flex items-center gap-1.5">
            <ZoomOut className="h-3.5 w-3.5 text-muted-foreground" />
            <Slider
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              min={60}
              max={150}
              step={5}
              className="w-20"
            />
            <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground w-8 text-center">{zoom}%</span>
          </div>
        </div>
      </div>

      {/* Spreadsheet */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full inline-block" style={{ fontSize: `${zoom}%` }}>
          <table className="w-max border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 40 }} />
              {columns.map(col => (
                <col key={col.id} style={{ width: col.width || DEFAULT_COL_WIDTH }} />
              ))}
              <col style={{ width: 40 }} />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <tr>
                <th className="px-2 py-2 text-center text-xs font-medium text-muted-foreground border-b border-r border-border/50">#</th>
                {columns.map((col, ci) => {
                  const TypeIcon = Icon(col.type);
                  return (
                    <th key={col.id} className="relative px-2 py-2 text-left text-xs font-medium text-muted-foreground border-b border-r border-border/50">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <TypeIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                        {editingColId === col.id ? (
                          <Input
                            autoFocus value={editColName}
                            onChange={e => setEditColName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') commitRenameCol(); if (e.key === 'Escape') setEditingColId(null); }}
                            onBlur={commitRenameCol}
                            className="h-5 text-xs py-0 border-0 shadow-none bg-transparent"
                            style={{ fontSize: 'inherit' }}
                          />
                        ) : (
                          <span className="truncate">{col.name}</span>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto shrink-0 opacity-60 hover:opacity-100">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuItem onClick={() => startRenameCol(col.id, col.name)}>
                              <Pencil className="h-3.5 w-3.5 mr-2" /> Renomear
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <TypeIcon className="h-3.5 w-3.5 mr-2" /> Tipo: {TYPE_LABELS[col.type]}
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {(Object.keys(TYPE_LABELS) as FinanceColumnType[]).map(t => (
                                  <DropdownMenuItem key={t} onClick={() => changeColumnType(col.id, t)}>
                                    {TYPE_LABELS[t]}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            {ci > 0 && (
                              <DropdownMenuItem onClick={() => moveColumn(col.id, -1)}>
                                <ArrowLeft className="h-3.5 w-3.5 mr-2" /> Mover esquerda
                              </DropdownMenuItem>
                            )}
                            {ci < columns.length - 1 && (
                              <DropdownMenuItem onClick={() => moveColumn(col.id, 1)}>
                                <ArrowRight className="h-3.5 w-3.5 mr-2" /> Mover direita
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteColumn(col.id)}>
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir coluna
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {/* Resize handle */}
                      <div
                        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors"
                        onMouseDown={e => onResizeStart(e, col.id)}
                      />
                    </th>
                  );
                })}
                <th className="px-1 py-2 border-b border-border/50">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAddCol(true)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={row.id} className="group hover:bg-muted/30 transition-colors">
                  <td className="px-2 py-1 text-center text-xs text-muted-foreground border-r border-border/30">
                    <div className="flex items-center justify-center gap-0.5">
                      <span className="group-hover:hidden">{ri + 1}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 hidden group-hover:flex" onClick={() => deleteRow(row.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </td>
                  {columns.map(col => (
                    <td key={col.id} className="px-1 py-0.5 border-r border-border/30 border-b border-border/20">
                      {renderCell(row, col)}
                    </td>
                  ))}
                  <td className="border-b border-border/20" />
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-muted/40 border-t border-border/50">
                  <td className="px-2 py-2 text-xs font-medium text-muted-foreground text-center border-r border-border/30">Σ</td>
                  {columns.map(col => {
                    const sum = getColumnSum(col);
                    return (
                      <td key={col.id} className="px-2 py-2 font-semibold tabular-nums border-r border-border/30">
                        {sum !== null ? (
                          col.type === 'number' ? sum.toLocaleString('pt-BR') : formatBRL(sum)
                        ) : ''}
                      </td>
                    );
                  })}
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Add row */}
        <div className="px-4 py-2 border-t border-border/30">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={addRow}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Nova linha
          </Button>
        </div>
      </div>

      {/* Add column dialog */}
      <Dialog open={showAddCol} onOpenChange={setShowAddCol}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Coluna</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Valor, Status, Data..."
                value={newCol.name || ''}
                onChange={e => setNewCol(p => ({ ...p, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={newCol.type || 'text'} onValueChange={v => setNewCol(p => ({ ...p, type: v as FinanceColumnType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_LABELS) as FinanceColumnType[]).map(t => (
                    <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newCol.type === 'select' && (
              <div className="space-y-2">
                <Label>Opções</Label>
                {newColOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      placeholder="Nome da opção"
                      value={opt.label}
                      onChange={e => {
                        const updated = [...newColOptions];
                        updated[i] = { ...updated[i], label: e.target.value };
                        setNewColOptions(updated);
                      }}
                      className="flex-1 h-9"
                    />
                    <Select value={opt.color} onValueChange={v => {
                      const updated = [...newColOptions];
                      updated[i] = { ...updated[i], color: v };
                      setNewColOptions(updated);
                    }}>
                      <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SELECT_COLORS.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {newColOptions.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setNewColOptions(newColOptions.filter((_, j) => j !== i))}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setNewColOptions([...newColOptions, { label: '', color: SELECT_COLORS[0].value }])}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Opção
                </Button>
              </div>
            )}

            {newCol.type === 'formula' && (
              <div className="space-y-2">
                <Label>Fórmula</Label>
                <Input
                  placeholder="Ex: Valor - Taxa"
                  value={newCol.formula || ''}
                  onChange={e => setNewCol(p => ({ ...p, formula: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Use nomes de colunas e operadores (+, -, *, /)
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCol(false)}>Cancelar</Button>
            <Button onClick={addColumn} disabled={!newCol.name?.trim()}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
