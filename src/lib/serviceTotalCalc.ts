import { CanvasElement } from '@/types/template';
import { TotalBlockLine } from '@/lib/totalBlockCalc';

/**
 * Compute total lines for a service block based on service variable values.
 * Sums all visible service prices and applies optional tax/fee.
 */
export function computeServiceTotalLines(
  el: CanvasElement,
  variableValues: Record<string, string>,
): TotalBlockLine[] {
  const count = el.serviceCount || 3;
  let subtotal = 0;

  for (let i = 0; i < count; i++) {
    const name = variableValues[`service_${i}_name`];
    if (!name) continue;
    const priceStr = variableValues[`service_${i}_price`] || '0';
    const cleaned = priceStr.replace(/[^\d.\-,]/g, '').replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned) || 0;
    subtotal += num;
  }

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
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(2).replace(/\.?0+$/, '')}%`;
}
