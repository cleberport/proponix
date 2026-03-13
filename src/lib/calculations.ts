import { Template } from '@/types/template';

/**
 * Evaluate simple formulas like "price * tax_rate", "price + tax"
 * Only supports +, -, * with variable references
 */
export function evaluateFormula(
  formula: string,
  values: Record<string, string>
): number {
  // Replace variable names with their numeric values
  let expr = formula;
  // Sort by length descending to avoid partial replacements
  const vars = Object.keys(values).sort((a, b) => b.length - a.length);
  for (const v of vars) {
    const num = parseFloat(values[v]) || 0;
    expr = expr.replace(new RegExp(v, 'g'), String(num));
  }
  // Only allow numbers, +, -, *, /, spaces, parentheses, dots
  if (!/^[\d\s+\-*/.()]+$/.test(expr)) return 0;
  try {
    // eslint-disable-next-line no-eval
    const result = Function(`"use strict"; return (${expr})`)();
    return typeof result === 'number' && isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}

/**
 * Given a template and user input values, compute all resolved values
 * including defaults and calculated fields
 */
export function resolveAllValues(
  template: Template,
  userInputs: Record<string, string>
): Record<string, string> {
  const defaults = template.defaultValues || {};
  const calculated = template.calculatedFields || {};

  // Start with defaults, then overlay user inputs
  const values: Record<string, string> = { ...defaults };

  // Apply user inputs (overwrite defaults)
  for (const [k, v] of Object.entries(userInputs)) {
    if (v) values[k] = v;
  }

  // Calculate fields in dependency order (simple: run twice to resolve deps)
  for (let pass = 0; pass < 3; pass++) {
    for (const [field, formula] of Object.entries(calculated)) {
      const result = evaluateFormula(formula, values);
      values[field] = result.toFixed(2);
    }
  }

  return values;
}

/**
 * Format a numeric string as currency
 */
export function formatCurrency(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
