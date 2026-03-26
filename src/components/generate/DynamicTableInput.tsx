import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

export interface DynamicRow {
  cells: string[];
}

interface Props {
  headers: string[];
  rows: DynamicRow[];
  onChange: (rows: DynamicRow[]) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const DynamicTableInput = ({ headers, rows, onChange, onFocus, onBlur }: Props) => {
  const addRow = () => {
    onChange([...rows, { cells: headers.map(() => '') }]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    onChange(rows.filter((_, i) => i !== index));
  };

  const updateCell = (rowIndex: number, cellIndex: number, value: string) => {
    const updated = rows.map((row, ri) =>
      ri === rowIndex
        ? { cells: row.cells.map((c, ci) => (ci === cellIndex ? value : c)) }
        : row
    );
    onChange(updated);
  };

  // Detect which column is the price/valor column (last numeric-looking column)
  const priceColIndex = headers.length - 1;

  const total = rows.reduce((sum, row) => {
    const val = row.cells[priceColIndex] || '';
    const cleaned = val.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return sum + (isFinite(num) ? num : 0);
  }, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Itens
        </h3>
        <span className="text-xs text-muted-foreground">
          {rows.length} {rows.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {rows.map((row, ri) => (
        <div key={ri} className="rounded-lg border border-border bg-background p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Item {ri + 1}</span>
            {rows.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => removeRow(ri)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="grid gap-2">
            {headers.map((header, ci) => (
              <Input
                key={ci}
                placeholder={header}
                value={row.cells[ci] || ''}
                onChange={(e) => updateCell(ri, ci, e.target.value)}
                className="h-10 text-sm"
                inputMode={ci === priceColIndex ? 'numeric' : 'text'}
              />
            ))}
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        className="w-full h-10 text-sm"
        onClick={addRow}
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Adicionar Item
      </Button>

      {total > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-accent/30 px-3 py-2">
          <span className="text-sm font-medium text-muted-foreground">Soma dos itens</span>
          <span className="text-sm font-semibold text-foreground">{formatCurrency(total.toString())}</span>
        </div>
      )}
    </div>
  );
};

export default DynamicTableInput;
