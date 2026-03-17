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
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Pre-crop an image to match CSS object-fit: cover behavior,
 * applying scale, offset, and opacity. Returns a data URL at exact container dimensions.
 */
function cropImageCover(
  img: HTMLImageElement,
  containerW: number,
  containerH: number,
  scale: number,
  offsetX: number,
  offsetY: number,
  opacity: number
): string {
  const canvas = document.createElement('canvas');
  // Use a reasonable resolution (max 1200px on longest side)
  const maxDim = 1200;
  const ratio = Math.min(1, maxDim / Math.max(containerW, containerH));
  const cw = Math.round(containerW * ratio);
  const ch = Math.round(containerH * ratio);
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, cw, ch);

  const alpha = (opacity ?? 100) / 100;
  if (alpha < 1) ctx.globalAlpha = alpha;

  const imgAR = img.naturalWidth / img.naturalHeight;
  const containerAR = containerW / containerH;

  // Step 1: compute "cover" draw size for the img element (which is scale * container)
  const imgElW = containerW * scale;
  const imgElH = containerH * scale;

  // Step 2: within that img element, object-fit: cover determines actual image render size
  const imgElAR = imgElW / imgElH;
  let renderW: number, renderH: number;
  if (imgAR > imgElAR) {
    // Image wider than element → match height, overflow width
    renderH = imgElH;
    renderW = renderH * imgAR;
  } else {
    // Image taller → match width, overflow height
    renderW = imgElW;
    renderH = renderW / imgAR;
  }

  // Step 3: center within the img element, then position img element at (0,0) + offset
  // The img element starts at (0,0) relative to container (CSS top:0 left:0)
  // Image content is centered within the img element by object-fit: cover
  const imgContentX = (imgElW - renderW) / 2;
  const imgContentY = (imgElH - renderH) / 2;

  // Final position: img element offset + image centering within element
  const drawX = (offsetX + imgContentX) * ratio;
  const drawY = (offsetY + imgContentY) * ratio;
  const drawW = renderW * ratio;
  const drawH = renderH * ratio;

  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, drawX, drawY, drawW, drawH);

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
  imageMap: Map<string, { data: string; w: number; h: number }>,
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
        const imgInfo = imageMap.get(el.id);
        if (imgInfo?.data) {
          const h = scaleH(el.height);
          const imgAR = imgInfo.w / imgInfo.h;
          const containerAR = w / h;
          const scale = el.imageScale || 1;
          const offsetX = el.imageOffsetX || 0;
          const offsetY = el.imageOffsetY || 0;

          // Cover: scale image to fill container, then apply user scale & offset
          let drawW: number, drawH: number;
          if (imgAR > containerAR) {
            // Image is wider → match height
            drawH = h * scale;
            drawW = drawH * imgAR;
          } else {
            // Image is taller → match width
            drawW = w * scale;
            drawH = drawW / imgAR;
          }

          // Center by default, then apply user pan offsets (scaled to PDF coords)
          const centerOffX = (w - drawW) / 2;
          const centerOffY = (h - drawH) / 2;
          const pdfOffX = scaleW(offsetX);
          const pdfOffY = scaleH(offsetY);
          const drawX = x + centerOffX + pdfOffX;
          const drawY = y + centerOffY + pdfOffY;

          // Clip to element bounds using raw PDF operators for reliable clipping
          const internal = pdf.internal as any;
          internal.write('q'); // save graphics state

          // Rectangle clip path: x y w h re W n (rect, clip, discard path)
          internal.write(
            `${x.toFixed(2)} ${(PDF_H - y - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re W n`
          );
          try { pdf.addImage(imgInfo.data, 'PNG', drawX, drawY, drawW, drawH); } catch {}
          internal.write('Q'); // restore graphics state
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
