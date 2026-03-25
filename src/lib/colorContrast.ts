/**
 * Utility for automatic text-vs-background contrast.
 *
 * Uses WCAG relative luminance to decide whether text on a given
 * background should be light or dark.
 */

/** Parse any CSS-ish colour string into [r, g, b] (0-255). Returns null on failure. */
export function parseColor(color: string | undefined | null): [number, number, number] | null {
  if (!color) return null;

  // #RGB / #RRGGBB / #RRGGBBAA
  const hex = color.replace(/^#/, '');
  if (/^[0-9a-fA-F]{3,8}$/.test(hex)) {
    let r: number, g: number, b: number;
    if (hex.length === 3 || hex.length === 4) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
    return [r, g, b];
  }

  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
  }

  // hsl(h, s%, l%) — quick estimation
  const hslMatch = color.match(/hsla?\(\s*([\d.]+)\s*,?\s*([\d.]+)%?\s*,?\s*([\d.]+)%?/);
  if (hslMatch) {
    const l = parseFloat(hslMatch[3]) / 100;
    // Rough: if lightness > 0.5 it's light
    const gray = Math.round(l * 255);
    return [gray, gray, gray];
  }

  return null;
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function relativeLuminance(r: number, g: number, b: number): number {
  const srgb = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/** Is the given colour perceptually "dark"? */
export function isDark(color: string | undefined | null): boolean {
  const rgb = parseColor(color);
  if (!rgb) return false; // treat unknown as light
  return relativeLuminance(...rgb) < 0.4;
}

/**
 * Return a suitable text colour for the given background.
 * - Dark background → '#FFFFFF'
 * - Light background → '#0F172A' (slate-900)
 */
export function contrastText(background: string | undefined | null): string {
  return isDark(background) ? '#FFFFFF' : '#0F172A';
}

/**
 * Resolve the effective text colour for a canvas element.
 * If the element has an explicit colour set by the user, keep it.
 * Otherwise auto-pick based on the canvas background.
 */
export function resolveTextColor(
  elementColor: string | undefined,
  canvasBackground: string | undefined,
): string {
  if (elementColor) return elementColor;
  return contrastText(canvasBackground);
}
