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

function loadImageAsDataUrl(url: string): Promise<{ data: string; w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 800 / img.naturalWidth);
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve({ data: canvas.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => resolve({ data: '', w: 0, h: 0 });
    img.src = url;
  });
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

async function preloadImages(elements: CanvasElement[]): Promise<Map<string, { data: string; w: number; h: number }>> {
  const imageMap = new Map<string, { data: string; w: number; h: number }>();
  const imageEls = elements.filter(el => (el.type === 'logo' || el.type === 'image') && el.imageUrl);
  const loaded = await Promise.all(imageEls.map(async el => ({
    id: el.id,
    ...(await loadImageAsDataUrl(el.imageUrl!)),
  })));
  loaded.forEach(item => imageMap.set(item.id, item));
  return imageMap;
}

function renderPageElements(
  pdf: jsPDF,
  elements: CanvasElement[],
  variableValues: Record<string, string>,
  imageMap: Map<string, { data: string; w: number; h: number }>
) {
  // White background
  pdf.setFillColor(255, 255, 255);
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
          lines.forEach((line, i) => {
            let tx = x;
            if (align === 'center') tx = x + w / 2;
            else if (align === 'right') tx = x + w;
            pdf.text(line, tx, y + fontSize + i * lineH, { align });
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
        let tx = x;
        if (align === 'center') tx = x + w / 2;
        else if (align === 'right') tx = x + w;
        pdf.text(displayText, tx, y + fontSize, { align });
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
          const ar = imgInfo.w / imgInfo.h;
          try { pdf.addImage(imgInfo.data, 'PNG', x, y, w, w / ar); } catch {}
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
  fileName: string
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
    renderPageElements(pdf, pages[i], variableValues, imageMap);
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
