import { FinanceColumn } from '@/types/finance';

export function evaluateFinanceFormula(
  formula: string,
  columns: FinanceColumn[],
  cells: Record<string, any>
): number {
  let expr = formula;
  const sorted = [...columns].sort((a, b) => b.name.length - a.name.length);
  for (const col of sorted) {
    const rawVal = cells[col.id];
    let val = 0;
    if (typeof rawVal === 'string') {
      val = parseFloat(rawVal.replace(/[^\d,.\-]/g, '').replace(',', '.')) || 0;
    } else if (typeof rawVal === 'number') {
      val = rawVal;
    } else {
      val = parseFloat(rawVal) || 0;
    }
    expr = expr.replaceAll(col.name, String(val));
  }
  if (!/^[\d\s+\-*/.()]+$/.test(expr)) return 0;
  try {
    const result = Function(`"use strict"; return (${expr})`)();
    return typeof result === 'number' && isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function getColumnNumericValue(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d,.\-]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }
  return 0;
}
