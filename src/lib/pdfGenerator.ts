import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CanvasElement } from '@/types/template';
import { resolveTextColor, isDark } from '@/lib/colorContrast';
import { getMultilineTextLayout, getServiceLayout, getSingleLineTextLayout } from '@/lib/absoluteLayout';

const CANVAS_W = 595;
const CANVAS_H = 842;
const PDF_W = 595.28;
const PDF_H = 841.89;

/**
 * Capture a DOM element (CanvasRenderer) as a high-res canvas image,
 * then place it into a PDF page. This ensures pixel-perfect match
 * between preview and PDF.
 */
async function captureElementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: null, // Preserve the element's own background
    width: CANVAS_W,
    height: CANVAS_H,
    logging: false,
  });
}

/**
 * Generate a PDF by capturing DOM elements (CanvasRenderer pages).
 * This is the preferred method — it guarantees the PDF matches the preview exactly.
 */
export async function generatePdfFromDom(
  pageElements: HTMLElement[],
  fileName: string,
  options?: { skipDownload?: boolean }
): Promise<Blob> {
  const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

  for (let i = 0; i < pageElements.length; i++) {
    if (i > 0) pdf.addPage();

    const canvas = await captureElementToCanvas(pageElements[i]);
    const imgData = canvas.toDataURL('image/png');

    pdf.addImage(imgData, 'PNG', 0, 0, PDF_W, PDF_H);
  }

  const blob = pdf.output('blob');

  if (!options?.skipDownload) {
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
  }

  return blob;
}

// ─── Legacy vector PDF (kept as fallback for cases without DOM access) ───

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

function getFontStyle(weight: string, fontStyle?: string): string {
  const isBold = parseInt(weight) >= 700;
  const isItalic = fontStyle === 'italic';
  if (isBold && isItalic) return 'bolditalic';
  if (isBold) return 'bold';
  if (isItalic) return 'italic';
  return 'normal';
}

function wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    if (para.trim() === '') { lines.push(''); continue; }
    lines.push(...pdf.splitTextToSize(para, maxWidth));
  }
  return lines;
}

function truncateTextToWidth(pdf: jsPDF, text: string, maxWidth: number): string {
  if (!text || pdf.getTextWidth(text) <= maxWidth) return text;

  const ellipsis = '…';
  let value = text;
  while (value.length > 0 && pdf.getTextWidth(`${value}${ellipsis}`) > maxWidth) {
    value = value.slice(0, -1);
  }

  return value ? `${value}${ellipsis}` : ellipsis;
}

function fitTextToBox(pdf: jsPDF, text: string, maxWidth: number, maxLines: number): string[] {
  const safeLines = Math.max(1, maxLines);
  const wrapped = wrapText(pdf, text, maxWidth);
  if (wrapped.length <= safeLines) return wrapped;

  const visible = wrapped.slice(0, safeLines);
  visible[safeLines - 1] = truncateTextToWidth(pdf, visible[safeLines - 1], maxWidth);
  return visible;
}

function drawAlignedLine(
  pdf: jsPDF,
  text: string,
  left: number,
  baseline: number,
  width: number,
  align: 'left' | 'center' | 'right' = 'left'
) {
  const textWidth = pdf.getTextWidth(text);
  let x = left;

  if (align === 'center') x = left + Math.max((width - textWidth) / 2, 0);
  if (align === 'right') x = left + Math.max(width - textWidth, 0);

  pdf.text(text, x, baseline);
}

function getColumnPixelWidths(totalWidth: number, columnCount: number, percentages?: number[]) {
  if (columnCount <= 0) return [] as number[];

  const values = percentages && percentages.length === columnCount
    ? percentages
    : Array.from({ length: columnCount }, () => 100 / columnCount);

  const total = values.reduce((sum, value) => sum + value, 0) || columnCount;
  let consumed = 0;

  return values.map((value, index) => {
    if (index === columnCount - 1) return Math.max(totalWidth - consumed, 0);
    const width = Math.max(Math.round((value / total) * totalWidth), 0);
    consumed += width;
    return width;
  });
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);

  const fromElement = (src: string, useCors: boolean): Promise<HTMLImageElement | null> =>
    new Promise((res) => {
      const img = new Image();
      if (useCors) img.crossOrigin = 'anonymous';
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = src;
    });

  const fromFetch = async (src: string): Promise<HTMLImageElement | null> => {
    try {
      const resp = await fetch(src);
      if (!resp.ok) return null;
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const img = await fromElement(blobUrl, false);
      return img;
    } catch {
      return null;
    }
  };

  if (url.startsWith('http')) {
    const sep = url.includes('?') ? '&' : '?';
    const bustUrl = `${url}${sep}_t=${Date.now()}`;
    return fromFetch(url)
      .then((img) => img || fromFetch(bustUrl))
      .then((img) => img || fromElement(url, true))
      .then((img) => img || fromElement(bustUrl, true))
      .then((img) => {
        if (!img) console.error('[pdfGen] Imagem falhou definitivamente:', url.substring(0, 100));
        return img;
      });
  }

  return fromElement(url, false)
    .then((img) => {
      if (!img) console.error('[pdfGen] Data URL falhou:', url.substring(0, 60));
      return img;
    });
}

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
  cropRect?: { cropX: number; cropY: number; cropW: number; cropH: number }
): string {
  const RES = 2;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(containerW * RES);
  canvas.height = Math.round(containerH * RES);
  const ctx = canvas.getContext('2d')!;

  ctx.scale(RES, RES);

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

  ctx.beginPath();
  ctx.rect(0, 0, containerW, containerH);
  ctx.clip();

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
  const bg = bgColor && bgColor !== '#ffffff' ? hexToRgb(bgColor) : [255, 255, 255] as [number, number, number];
  pdf.setFillColor(...bg);
  pdf.rect(0, 0, PDF_W, PDF_H, 'F');

  for (const el of elements) {
    const x = scaleX(el.x);
    const y = scaleY(el.y);
    const w = scaleW(el.width);
    const effectiveColor = resolveTextColor(el.color, bgColor);
    const color = hexToRgb(effectiveColor);
    const fontSize = (el.fontSize || 14) * (PDF_W / CANVAS_W);
    const fontStyle = getFontStyle(el.fontWeight || '400', el.fontStyle);
    const lineH = fontSize * (el.lineHeight || 1.4);

    switch (el.type) {
      case 'text':
      case 'notes': {
        let content = resolveContent(el, variableValues);
        // Apply list formatting
        if (el.listType && el.listType !== 'none') {
          content = content.split('\n').map((line, i) =>
            el.listType === 'bullet' ? `• ${line}` : `${i + 1}. ${line}`
          ).join('\n');
        }
        pdf.setFont('helvetica', fontStyle);
        pdf.setFontSize(fontSize);
        pdf.setTextColor(...color);

        if (el.type === 'notes') {
          pdf.setDrawColor(200, 200, 200);
          const h = scaleH(el.height);
          pdf.setFillColor(249, 250, 251);
          pdf.roundedRect(x, y, w, h, 3, 3, 'FD');
          const layout = getMultilineTextLayout({ width: el.width, height: el.height, fontSize: el.fontSize || 14, paddingX: 8, paddingY: 8, lineHeight: el.lineHeight || 1.4 });
          const lines = fitTextToBox(pdf, content, scaleW(layout.width), layout.maxLines);
          lines.forEach((line, i) => {
            drawAlignedLine(pdf, line, x + scaleW(layout.left), y + scaleH(layout.top) + fontSize * 0.82 + i * fontSize * (el.lineHeight || 1.4), scaleW(layout.width), el.alignment || 'left');
          });
        } else {
          const layout = getMultilineTextLayout({ width: el.width, height: el.height, fontSize: el.fontSize || 14, lineHeight: el.lineHeight || 1.4 });
          const lines = fitTextToBox(pdf, content, scaleW(layout.width), layout.maxLines);
          const align = el.alignment || 'left';
          lines.forEach((line, i) => {
            const baseline = y + scaleH(layout.top) + fontSize * 0.82 + i * lineH;
            const lineLeft = x + scaleW(layout.left);
            drawAlignedLine(pdf, line, lineLeft, baseline, scaleW(layout.width), align);
            // Underline
            if (el.textDecoration === 'underline') {
              const textW = pdf.getTextWidth(line);
              let ux = lineLeft;
              if (align === 'center') ux = lineLeft + Math.max((scaleW(layout.width) - textW) / 2, 0);
              else if (align === 'right') ux = lineLeft + Math.max(scaleW(layout.width) - textW, 0);
              const uy = baseline + fontSize * 0.15;
              pdf.setDrawColor(...color);
              pdf.setLineWidth(fontSize * 0.05);
              pdf.line(ux, uy, ux + textW, uy);
            }
            // Strikethrough
            if (el.textDecoration === 'line-through') {
              const textW = pdf.getTextWidth(line);
              let ux = lineLeft;
              if (align === 'center') ux = lineLeft + Math.max((scaleW(layout.width) - textW) / 2, 0);
              else if (align === 'right') ux = lineLeft + Math.max(scaleW(layout.width) - textW, 0);
              const uy = baseline - fontSize * 0.25;
              pdf.setDrawColor(...color);
              pdf.setLineWidth(fontSize * 0.05);
              pdf.line(ux, uy, ux + textW, uy);
            }
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
        const layout = getSingleLineTextLayout({ width: el.width, height: el.height, fontSize: el.fontSize || 14 });
        const text = truncateTextToWidth(pdf, displayText, scaleW(layout.width));
        const lineLeft = x + scaleW(layout.left);
        const baseline = y + scaleH(layout.top) + fontSize * 0.82;
        drawAlignedLine(pdf, text, lineLeft, baseline, scaleW(layout.width), align);
        if (el.textDecoration === 'underline') {
          const textW = pdf.getTextWidth(text);
          let ux = lineLeft;
          if (align === 'center') ux = lineLeft + Math.max((scaleW(layout.width) - textW) / 2, 0);
          else if (align === 'right') ux = lineLeft + Math.max(scaleW(layout.width) - textW, 0);
          const uy = baseline + fontSize * 0.15;
          pdf.setDrawColor(...color);
          pdf.setLineWidth(fontSize * 0.05);
          pdf.line(ux, uy, ux + textW, uy);
        }
        break;
      }

      case 'divider': {
        const divColor = el.color ? hexToRgb(el.color) : [226, 232, 240] as [number, number, number];
        pdf.setDrawColor(...divColor);
        pdf.setLineWidth(Math.max(scaleH(el.height), 0.5));
        pdf.line(x, y, x + w, y);
        break;
      }

      case 'shape': {
        const shapeColor = el.shapeColor ? hexToRgb(el.shapeColor) : [59, 130, 246] as [number, number, number];
        const opacity = (el.shapeOpacity ?? 100) / 100;
        const h = scaleH(el.height);
        const radius = el.shapeBorderRadius ? Math.min(scaleW(el.shapeBorderRadius), w / 2, h / 2) : 0;

        pdf.setGState(new (pdf as any).GState({ opacity }));
        pdf.setFillColor(...shapeColor);

        if ((el.shapeBorderWidth || 0) > 0) {
          const borderColor = el.shapeBorderColor ? hexToRgb(el.shapeBorderColor) : [0, 0, 0] as [number, number, number];
          pdf.setDrawColor(...borderColor);
          pdf.setLineWidth(scaleW(el.shapeBorderWidth || 1));
          if (radius > 0) {
            pdf.roundedRect(x, y, w, h, radius, radius, 'FD');
          } else {
            pdf.rect(x, y, w, h, 'FD');
          }
        } else {
          if (radius > 0) {
            pdf.roundedRect(x, y, w, h, radius, radius, 'F');
          } else {
            pdf.rect(x, y, w, h, 'F');
          }
        }

        pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
        break;
      }

      case 'logo':
      case 'image': {
        const img = imageMap.get(el.id);
        if (img) {
          const h = scaleH(el.height);
          const isLogo = el.type === 'logo';

          if (isLogo) {
            const natW = img.naturalWidth || img.width;
            const natH = img.naturalHeight || img.height;
            const imgAR = natW / natH;
            const boxAR = w / h;

            let drawW = w;
            let drawH = h;
            let drawX = x;
            let drawY = y;

            if (imgAR > boxAR) {
              drawW = w;
              drawH = w / imgAR;
              drawY = y + (h - drawH) / 2;
            } else {
              drawH = h;
              drawW = h * imgAR;
              drawX = x + (w - drawW) / 2;
            }

            try {
              const darkBg = isDark(bgColor);
              if (darkBg) {
                const canvas = document.createElement('canvas');
                canvas.width = natW;
                canvas.height = natH;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.filter = 'brightness(0) invert(1)';
                  ctx.drawImage(img, 0, 0, natW, natH);
                  const invertedUrl = canvas.toDataURL('image/png');
                  pdf.addImage(invertedUrl, 'PNG', drawX, drawY, drawW, drawH);
                } else {
                  pdf.addImage(img, 'PNG', drawX, drawY, drawW, drawH);
                }
              } else {
                const format = img.src?.includes('image/png') || img.src?.includes('.png') ? 'PNG' : 'JPEG';
                pdf.addImage(img, format, drawX, drawY, drawW, drawH);
              }
            } catch (e) {
              console.error('[pdfGen] Falha ao desenhar logo:', e);
            }
            break;
          }

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

          let croppedDataUrl: string | null = null;
          try {
            croppedDataUrl = cropImageCover(
              img,
              el.width,
              el.height,
              scale,
              offsetX,
              offsetY,
              opacity,
              filters,
              cropRect
            );
          } catch (err) {
            console.error('[pdfGen] Falha ao recortar imagem, aplicando fallback:', err);
          }

          if (el.rotation) {
            pdf.saveGraphicsState();
            const cx = x + w / 2;
            const cy = y + h / 2;
            const rad = (el.rotation * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            (pdf as any).internal.write(
              `${cos.toFixed(6)} ${sin.toFixed(6)} ${(-sin).toFixed(6)} ${cos.toFixed(6)} ${cx.toFixed(2)} ${(PDF_H - cy).toFixed(2)} cm`
            );
            try {
              if (croppedDataUrl) {
                pdf.addImage(croppedDataUrl, 'PNG', -w / 2, -h / 2, w, h);
              } else {
                pdf.addImage(img, 'PNG', -w / 2, -h / 2, w, h);
              }
            } catch (e) {
              console.error('[pdfGen] Falha ao desenhar imagem rotacionada:', e);
            }
            pdf.restoreGraphicsState();
          } else {
            try {
              if (croppedDataUrl) {
                pdf.addImage(croppedDataUrl, 'PNG', x, y, w, h);
              } else {
                pdf.addImage(img, 'PNG', x, y, w, h);
              }
            } catch (e) {
              console.error('[pdfGen] Falha ao desenhar imagem:', e);
            }
          }

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
        const colWidths = getColumnPixelWidths(el.width, cols, el.columnWidths);
        const rowHCanvas = el.height / el.rows.length;
        const rowH = scaleH(rowHCanvas);
        const borderCol = el.tableBorderColor ? hexToRgb(el.tableBorderColor) : [226, 232, 240] as [number, number, number];
        const headerBgCol = el.tableHeaderBg ? hexToRgb(el.tableHeaderBg) : [241, 245, 249] as [number, number, number];
        const rowBgCol = el.tableRowBg ? hexToRgb(el.tableRowBg) : null;
        el.rows.forEach((row, ri) => {
          const ry = y + ri * rowH;
          if (ri === 0) { pdf.setFillColor(...headerBgCol); pdf.rect(x, ry, w, rowH, 'F'); }
          else if (rowBgCol) { pdf.setFillColor(...rowBgCol); pdf.rect(x, ry, w, rowH, 'F'); }
          pdf.setDrawColor(...borderCol);
          pdf.setLineWidth(0.5);
          pdf.rect(x, ry, w, rowH, 'S');
          let cellOffset = 0;
          row.cells.forEach((cell, ci) => {
            const cellWidthCanvas = colWidths[ci] ?? 0;
            const cellWidth = scaleW(cellWidthCanvas);
            const cx = x + scaleW(cellOffset);
            cellOffset += cellWidthCanvas;
            if (ci > 0) pdf.line(cx, ry, cx, ry + rowH);
            let cellText = cell;
            Object.entries(variableValues).forEach(([k, v]) => {
              cellText = cellText.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v || '');
            });
            pdf.setFont('helvetica', ri === 0 ? 'bold' : 'normal');
            pdf.setFontSize(fontSize * 0.75);
            pdf.setTextColor(15, 23, 42);
            const cellLineHeight = fontSize * 0.95;
            const maxLines = Math.max(1, Math.floor((rowH - 12) / Math.max(cellLineHeight, 1)));
            const lines = fitTextToBox(pdf, cellText, Math.max(cellWidth - 12, 0), maxLines);
            lines.forEach((line, index) => {
              drawAlignedLine(pdf, line, cx + 6, ry + 6 + fontSize * 0.75 * 0.82 + index * cellLineHeight, Math.max(cellWidth - 12, 0), 'left');
            });
          });
        });
        break;
      }

      case 'service': {
        const svcIdx = el.serviceIndex ?? 0;
        const svcName = variableValues[`service_${svcIdx}_name`] || '';
        const svcDesc = variableValues[`service_${svcIdx}_description`] || '';
        const svcPrice = variableValues[`service_${svcIdx}_price`] || '';
        const showPrice = el.showPrice !== false;
        const hasContent = svcName || svcDesc || (showPrice && svcPrice);
        if (!hasContent) break;

        const borderColor = el.tableBorderColor ? hexToRgb(el.tableBorderColor) : [226, 232, 240] as [number, number, number];
        const opacity = (el.bgOpacity ?? 100) / 100;
        const serviceLayout = getServiceLayout({
          width: el.width,
          height: el.height,
          fontSize: el.fontSize || 14,
          hasDescription: Boolean(svcDesc),
          hasPrice: Boolean(showPrice && svcPrice),
        });

        if (opacity < 1) {
          pdf.setFillColor(255, 255, 255);
          pdf.setGState(new (pdf as any).GState({ opacity: opacity * 0.1 }));
          pdf.rect(x, y, w, scaleH(el.height), 'F');
          pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(fontSize);
        pdf.setTextColor(...color);
        const nameLines = fitTextToBox(pdf, svcName, scaleW(serviceLayout.name.width), serviceLayout.name.maxLines);
        nameLines.forEach((line, index) => {
          drawAlignedLine(
            pdf,
            line,
            x + scaleW(serviceLayout.name.left),
            y + scaleH(serviceLayout.name.top) + fontSize * 0.82 + index * fontSize * 1.25,
            scaleW(serviceLayout.name.width),
            'left'
          );
        });

        if (serviceLayout.description && svcDesc) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(serviceLayout.description.fontSize * (PDF_W / CANVAS_W));
          pdf.setTextColor(...color);
          const descFont = serviceLayout.description.fontSize * (PDF_W / CANVAS_W);
          const descLines = fitTextToBox(pdf, svcDesc, scaleW(serviceLayout.description.width), serviceLayout.description.maxLines);
          descLines.forEach((line, index) => {
            drawAlignedLine(
              pdf,
              line,
              x + scaleW(serviceLayout.description!.left),
              y + scaleH(serviceLayout.description!.top) + descFont * 0.82 + index * descFont * 1.16,
              scaleW(serviceLayout.description!.width),
              'left'
            );
          });
        }

        if (serviceLayout.price && showPrice && svcPrice) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(fontSize);
          pdf.setTextColor(...color);
          const priceText = truncateTextToWidth(pdf, svcPrice, scaleW(serviceLayout.price.width));
          drawAlignedLine(
            pdf,
            priceText,
            x + scaleW(serviceLayout.price.left),
            y + scaleH(serviceLayout.price.top) + fontSize * 0.82,
            scaleW(serviceLayout.price.width),
            'right'
          );
        }

        if ((el.bgOpacity ?? 100) >= 50) {
          pdf.setDrawColor(...borderColor);
          pdf.setLineWidth(0.5);
          pdf.line(x + scaleW(serviceLayout.paddingX), y + scaleH(serviceLayout.dividerY), x + w - scaleW(serviceLayout.paddingX), y + scaleH(serviceLayout.dividerY));
        }
        break;
      }
    }
  }
}

/**
 * Legacy vector PDF generator (fallback).
 * Use generatePdfFromDom when DOM elements are available for pixel-perfect output.
 */
export async function generateVectorPdf(
  elementsOrPages: CanvasElement[] | CanvasElement[][],
  variableValues: Record<string, string>,
  fileName: string,
  options?: { backgroundColor?: string; skipDownload?: boolean }
): Promise<Blob> {
  const pages: CanvasElement[][] = Array.isArray(elementsOrPages[0]) && Array.isArray((elementsOrPages as any[])[0])
    ? (elementsOrPages as CanvasElement[][])
    : [elementsOrPages as CanvasElement[]];

  const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

  const allElements = pages.flat();
  const imageMap = await preloadImages(allElements);

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage();
    renderPageElements(pdf, pages[i], variableValues, imageMap, options?.backgroundColor);
  }

  const blob = pdf.output('blob');

  if (!options?.skipDownload) {
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
  }

  return blob;
}
