import { CanvasElement } from '@/types/template';

export interface TotalBlockLine {
  label: string;
  value: string;
  bold: boolean;
}

/**
 * Calculate total block lines from element config + resolved variable values.
 * Reads `price` from variableValues as the subtotal base.
 */
export function computeTotalBlockLines(
  el: CanvasElement,
  variableValues: Record<string, string>
): TotalBlockLine[] {
  const rawPrice = variableValues?.price || '0';
  const subtotal = parseFloat(rawPrice.replace(/[^\d.\-]/g, '')) || 0;

  const lines: TotalBlockLine[] = [];
  const hasTax = el.totalShowTax && (el.totalTaxPercent || 0) > 0;
  const hasFee = el.totalShowFee && (el.totalFeePercent || 0) > 0;

  const taxPercent = el.totalTaxPercent || 0;
  const feePercent = el.totalFeePercent || 0;
  const feeName = el.totalFeeName || 'Taxa';

  const taxValue = hasTax ? subtotal * (taxPercent / 100) : 0;
  const afterTax = subtotal + taxValue;
  const feeValue = hasFee ? afterTax * (feePercent / 100) : 0;
  const finalTotal = afterTax + feeValue;

  // Only show subtotal label if there are additional lines
  if (hasTax || hasFee) {
    lines.push({ label: 'Subtotal', value: formatBRL(subtotal), bold: false });
  }

  if (hasTax) {
    lines.push({ label: `Imposto (${formatPercent(taxPercent)})`, value: formatBRL(taxValue), bold: false });
  }

  if (hasFee) {
    lines.push({ label: `${feeName} (${formatPercent(feePercent)})`, value: formatBRL(feeValue), bold: false });
  }

  lines.push({ label: 'Total', value: formatBRL(finalTotal), bold: true });

  return lines;
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPercent(value: number): string {
  // Show clean percentages: 10% not 10.00%
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(2).replace(/\.?0+$/, '')}%`;
}
