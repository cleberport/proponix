import { Template } from '@/types/template';

/**
 * Evaluate simple formulas like "price * tax_rate", "price + tax"
 */
export function evaluateFormula(
  formula: string,
  values: Record<string, string>
): number {
  let expr = formula;
  const vars = Object.keys(values).sort((a, b) => b.length - a.length);
  for (const v of vars) {
    const num = parseFloat(values[v]) || 0;
    expr = expr.replace(new RegExp(v, 'g'), String(num));
  }
  if (!/^[\d\s+\-*/.()]+$/.test(expr)) return 0;
  try {
    const result = Function(`"use strict"; return (${expr})`)();
    return typeof result === 'number' && isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}

/**
 * Given a template and user input values, compute all resolved values
 */
export function resolveAllValues(
  template: Template,
  userInputs: Record<string, string>
): Record<string, string> {
  const defaults = template.defaultValues || {};
  const calculated = template.calculatedFields || {};

  const values: Record<string, string> = { ...defaults };

  for (const [k, v] of Object.entries(userInputs)) {
    if (v) values[k] = v;
  }

  // Calculate fields in dependency order (run 3 passes)
  for (let pass = 0; pass < 3; pass++) {
    for (const [field, formula] of Object.entries(calculated)) {
      const result = evaluateFormula(formula, values);
      values[field] = result.toFixed(2);
    }
  }

  return values;
}

/**
 * Format a numeric string as BRL currency
 */
export function formatCurrency(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Convert percentage input (e.g. "10" or "11.29") to decimal (0.10, 0.1129)
 */
export function percentToDecimal(percent: number): number {
  return percent / 100;
}

/**
 * Convert decimal to percentage display (0.10 → 10)
 */
export function decimalToPercent(decimal: number): number {
  return decimal * 100;
}

/**
 * Format smart event date
 * Single: "23/04/2026" → "23/04/2026"
 * Range same month: "23/05/2026 a 24/05/2026" → "23 a 24/05/2026"
 * Range diff months: "23/05/2026 a 02/06/2026" → "23/05 a 02/06/2026"
 */
export function formatEventDate(input: string): string {
  if (!input) return '';
  
  // Check for range with "a" or "to" or "-"
  const rangeMatch = input.match(/^(\d{2}\/\d{2}\/\d{4})\s*(?:a|to|-)\s*(\d{2}\/\d{2}\/\d{4})$/i);
  if (!rangeMatch) return input;

  const [, startStr, endStr] = rangeMatch;
  const [startDay, startMonth, startYear] = startStr.split('/');
  const [endDay, endMonth, endYear] = endStr.split('/');

  if (startYear !== endYear) {
    return `${startStr} a ${endStr}`;
  }

  if (startMonth === endMonth) {
    return `${startDay} a ${endDay}/${endMonth}/${endYear}`;
  }

  return `${startDay}/${startMonth} a ${endDay}/${endMonth}/${endYear}`;
}
