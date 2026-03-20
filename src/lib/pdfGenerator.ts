import jsPDF from 'jspdf';
import { CanvasElement } from '@/types/template';

const CANVAS_W = 595;
const CANVAS_H = 842;
const PDF_W = 595.28;
const PDF_H = 841.89;

const scaleX = (x: number) => (x / CANVAS_W) * PDF_W;
const scaleY = (y: number) => (y / CANVAS_H) * PDF_H;
const scaleW = (w: number) => (w / CANVAS_W) * PDF_W;
const scaleH = (h: number) => (h / CANVAS_H) * PDF_H;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function getFontStyle(weight: string): string {
  return parseInt(weight) >= 700 ? 'bold' : 'normal';
}

function wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    if (para.trim() === '') { lines.push(''); continue; }
    lines.push(...pdf.splitTextToSize(para, maxWidth));
  }
  return lines;
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);

  const tryLoad = (src: string, useCors: boolean): Promise<HTMLImageElement | null> =>
    new Promise((res) => {
      const img = new Image();
      if (useCors) img.crossOrigin = 'anonymous';
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = src;
    });

  return tryLoad(url, true)
    .then((img) => {
      if (img) return img;
      console.warn('[pdfGen] Retentando sem CORS:', url.substring(0, 80));
      return tryLoad(url, false);
    })
    .then((img) => {
      if (img) return img;
      if (url.startsWith('http')) {
        const sep = url.includes('?') ? '&' : '?';
        return tryLoad(`${url}${sep}_t=${Date.now()}`, true);
      }
      return null;
    })
    .then((img) => {
      if (!img) console.error('[pdfGen] Imagem falhou definitivamente:', url.substring(0, 80));
      return img;
    });
}

/**
 * Pre-crop an image to exactly match what CSS renders:
 * Container (overflow:hidden) → <img> (position:absolute, width:scale*100%, height:scale*100%,
 * object-fit:cover, transform:translate(offsetX,offsetY))
 *
 * Returns a PNG data URL at exact container pixel dimensions (×2 for sharpness).
 */
function getCoverSourceRect(natW: number, natH: number, targetW: number, targetH: number) {
  const imgAspect = natW / natH;
  const targetAspect = targetW / targetH;

  if (imgAspect > targetAspect) {
    const sh = natH;
    const sw = sh * targetAspect;
    const sx = (natW - sw) / 2;
    return { sx, sy: 0, sw, sh };
  }

  const sw = natW;
  const sh = sw / targetAspect;
  const sy = (natH - sh) / 2;
  return { sx: 0, sy, sw, sh };
}

function cropImageCover(
  img: HTMLImageElement,
  containerW: number,
  containerH: number,
  scale: number,
  offsetX: number,
  offsetY: number,
  opacity: number,
  filters?: { brightness?: number; contrast?: number; saturation?: number },
  cropRect?: { cropX: number; cropY: number; cropW: number; cropH: number },
  bgColor?: string
): string {
  const RES = 2;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(containerW * RES);
  canvas.height = Math.round(containerH * RES);
  const ctx = canvas.getContext('2d')!;

  ctx.scale(RES, RES);

  // Fill with page background color so transparent PNGs blend correctly
  ctx.fillStyle = bgColor || '#ffffff';
  ctx.fillRect(0, 0, containerW, containerH);

  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const imgElW = containerW * safeScale;
  const imgElH = containerH * safeScale;
  const imgElX = offsetX || 0;
  const imgElY = offsetY || 0;

  const fp: string[] = [];
  if (filters?.brightness != null && filters.brightness !== 100) fp.push(`brightness(${filters.brightness / 100})`);
  if (filters?.contrast != null && filters.contrast !== 100) fp.push(`contrast(${filters.contrast / 100})`);
  if (filters?.saturation != null && filters.saturation !== 100) fp.push(`saturate(${filters.saturation / 100})`);

  ctx.save();

  // Container clip (overflow:hidden)
  ctx.beginPath();
  ctx.rect(0, 0, containerW, containerH);
  ctx.clip();

  // Image clip-path inset(...) is relative to the transformed/scaled image element box
  if (cropRect && (cropRect.cropX > 0 || cropRect.cropY > 0 || cropRect.cropW < 100 || cropRect.cropH < 100)) {
    const cx = imgElX + (cropRect.cropX / 100) * imgElW;
    const cy = imgElY + (cropRect.cropY / 100) * imgElH;
    const cw = (cropRect.cropW / 100) * imgElW;
    const ch = (cropRect.cropH / 100) * imgElH;
    ctx.beginPath();
    ctx.rect(cx, cy, cw, ch);
    ctx.clip();
  }

  ctx.globalAlpha = Math.min(1, Math.max(0, (opacity ?? 100) / 100));
  if (fp.length) ctx.filter = fp.join(' ');

  // object-fit: cover in the image element box
  const natW = img.naturalWidth;
  const natH = img.naturalHeight;
  const { sx, sy, sw, sh } = getCoverSourceRect(natW, natH, imgElW, imgElH);
  ctx.drawImage(img, sx, sy, sw, sh, imgElX, imgElY, imgElW, imgElH);

  ctx.restore();
  return canvas.toDataURL('image/png');
}

function resolveContent(el: CanvasElement, variableValues: Record<string, string>): string {
  let text = el.content || '';
  Object.entries(variableValues).forEach(([k, v]) => {
    text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v || '');
  });
  return text;
}

function resolveVariable(el: CanvasElement, variableValues: Record<string, string>): string {
  return el.variable ? (variableValues[el.variable] || '') : '';
}

async function preloadImages(elements: CanvasElement[]): Promise<Map<string, HTMLImageElement>> {
  const imageMap = new Map<string, HTMLImageElement>();
  const imageEls = elements.filter(el => (el.type === 'logo' || el.type === 'image') && el.imageUrl);
  await Promise.all(imageEls.map(async el => {
    const img = await loadImage(el.imageUrl!);
    if (img) imageMap.set(el.id, img);
  }));
  return imageMap;
}

function renderPageElements(
  pdf: jsPDF,
  elements: CanvasElement[],
  variableValues: Record<string, string>,
  imageMap: Map<string, HTMLImageElement>,
  bgColor?: string
) {
  // Background
  const bg = bgColor && bgColor !== '#ffffff' ? hexToRgb(bgColor) : [255, 255, 255] as [number, number, number];
  pdf.setFillColor(...bg);
  pdf.rect(0, 0, PDF_W, PDF_H, 'F');

  for (const el of elements) {
    const x = scaleX(el.x);
    const y = scaleY(el.y);
    const w = scaleW(el.width);
    const color = el.color ? hexToRgb(el.color) : [15, 23, 42] as [number, number, number];
    const fontSize = (el.fontSize || 14) * (PDF_W / CANVAS_W);
    const fontStyle = getFontStyle(el.fontWeight || '400');

    switch (el.type) {
      case 'text':
      case 'notes': {
        const content = resolveContent(el, variableValues);
        pdf.setFont('helvetica', fontStyle);
        pdf.setFontSize(fontSize);
        pdf.setTextColor(...color);

        if (el.type === 'notes') {
          pdf.setDrawColor(200, 200, 200);
          const h = scaleH(el.height);
          pdf.setFillColor(249, 250, 251);
          pdf.roundedRect(x, y, w, h, 3, 3, 'FD');
          const lines = wrapText(pdf, content, w - 16);
          const lineH = fontSize * 1.4;
          lines.forEach((line, i) => pdf.text(line, x + 8, y + 12 + i * lineH));
        } else {
          const lines = wrapText(pdf, content, w);
          const lineH = fontSize * 1.4;
          const align = el.alignment || 'left';
          // CSS renders text from top of element box; baseline ≈ top + ascent
          // Use a consistent ascent ratio to match browser rendering
          const ascent = fontSize * 0.82;
          lines.forEach((line, i) => {
            let tx = x;
            if (align === 'center') tx = x + w / 2;
            else if (align === 'right') tx = x + w;
            pdf.text(line, tx, y + ascent + i * lineH, { align });
          });
        }
        break;
      }

      case 'dynamic-field':
      case 'price-field':
      case 'total-calculation': {
        const label = resolveContent(el, variableValues);
        const value = resolveVariable(el, variableValues);
        pdf.setFont('helvetica', fontStyle);
        pdf.setFontSize(fontSize);
        pdf.setTextColor(...color);
        const align = el.alignment || 'left';
        const displayText = label ? `${label} ${value}` : value;
        // Canvas uses flex items-center → vertically center text within element height
        const h = scaleH(el.height);
        const textBaseline = y + h / 2 + fontSize * 0.3;
        let tx = x;
        if (align === 'center') tx = x + w / 2;
        else if (align === 'right') tx = x + w;
        pdf.text(displayText, tx, textBaseline, { align });
        break;
      }

      case 'divider': {
        const divColor = el.color ? hexToRgb(el.color) : [226, 232, 240] as [number, number, number];
        pdf.setDrawColor(...divColor);
        pdf.setLineWidth(Math.max(scaleH(el.height), 0.5));
        pdf.line(x, y, x + w, y);
        break;
      }

      case 'logo':
      case 'image': {
        const img = imageMap.get(el.id);
        if (img) {
          const h = scaleH(el.height);
          const scale = el.imageScale || 1;
          const offsetX = el.imageOffsetX || 0;
          const offsetY = el.imageOffsetY || 0;
          const opacity = el.imageOpacity ?? 100;

          const filters = {
            brightness: el.imageBrightness,
            contrast: el.imageContrast,
            saturation: el.imageSaturation,
          };

          const hasCrop = (el.cropX || 0) > 0 || (el.cropY || 0) > 0 ||
            (el.cropWidth != null && el.cropWidth < 100) ||
            (el.cropHeight != null && el.cropHeight < 100);
          const cropRect = hasCrop ? {
            cropX: el.cropX || 0,
            cropY: el.cropY || 0,
            cropW: el.cropWidth || 100,
            cropH: el.cropHeight || 100,
          } : undefined;

          const croppedDataUrl = cropImageCover(
            img,
            el.width,
            el.height,
            scale,
            offsetX,
            offsetY,
            opacity,
            filters,
            cropRect,
            bgColor
          );

          // Handle rotation
          if (el.rotation) {
            pdf.saveGraphicsState();
            const cx = x + w / 2;
            const cy = y + h / 2;
            const rad = (el.rotation * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            // Apply rotation transform matrix around center
            (pdf as any).internal.write(
              `${cos.toFixed(6)} ${sin.toFixed(6)} ${(-sin).toFixed(6)} ${cos.toFixed(6)} ${cx.toFixed(2)} ${(PDF_H - cy).toFixed(2)} cm`
            );
            try {
              pdf.addImage(croppedDataUrl, 'PNG', -w / 2, -h / 2, w, h);
            } catch {}
            pdf.restoreGraphicsState();
          } else {
            try {
              pdf.addImage(croppedDataUrl, 'PNG', x, y, w, h);
            } catch {}
          }

          // Border
          if ((el.borderWidth || 0) > 0) {
            const bColor = el.borderColor ? hexToRgb(el.borderColor) : [0, 0, 0] as [number, number, number];
            pdf.setDrawColor(...bColor);
            pdf.setLineWidth(el.borderWidth || 1);
            if (el.borderRadius && el.borderRadius > 0) {
              const r = Math.min(el.borderRadius, w / 2, h / 2);
              pdf.roundedRect(x, y, w, h, r, r, 'S');
            } else {
              pdf.rect(x, y, w, h, 'S');
            }
          }
        }
        break;
      }

      case 'table': {
        if (!el.rows?.length) break;
        const cols = el.rows[0].cells.length;
        const colW = w / cols;
        const rowH = scaleH(el.height) / el.rows.length;
        el.rows.forEach((row, ri) => {
          const ry = y + ri * rowH;
          if (ri === 0) { pdf.setFillColor(241, 245, 249); pdf.rect(x, ry, w, rowH, 'F'); }
          pdf.setDrawColor(226, 232, 240);
          pdf.setLineWidth(0.5);
          pdf.rect(x, ry, w, rowH, 'S');
          row.cells.forEach((cell, ci) => {
            const cx = x + ci * colW;
            if (ci > 0) pdf.line(cx, ry, cx, ry + rowH);
            let cellText = cell;
            Object.entries(variableValues).forEach(([k, v]) => {
              cellText = cellText.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v || '');
            });
            pdf.setFont('helvetica', ri === 0 ? 'bold' : 'normal');
            pdf.setFontSize(fontSize * 0.75);
            pdf.setTextColor(15, 23, 42);
            pdf.text(cellText, cx + 6, ry + rowH / 2 + 3);
          });
        });
        break;
      }
    }
  }
}

/**
 * Generate a multi-page vector PDF.
 * Accepts either a flat array of elements (single page) or an array of pages.
 */
export async function generateVectorPdf(
  elementsOrPages: CanvasElement[] | CanvasElement[][],
  variableValues: Record<string, string>,
  fileName: string,
  options?: { backgroundColor?: string }
): Promise<Blob> {
  // Normalize to pages array
  const pages: CanvasElement[][] = Array.isArray(elementsOrPages[0]) && Array.isArray((elementsOrPages as any[])[0])
    ? (elementsOrPages as CanvasElement[][])
    : [elementsOrPages as CanvasElement[]];

  const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

  // Preload all images across all pages
  const allElements = pages.flat();
  const imageMap = await preloadImages(allElements);

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage();
    renderPageElements(pdf, pages[i], variableValues, imageMap, options?.backgroundColor);
  }

  // Instant download
  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);

  return blob;
}
