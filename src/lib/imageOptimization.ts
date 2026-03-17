import { CanvasElement } from '@/types/template';

interface OptimizeImageOptions {
  maxDimension?: number;
  targetBytes?: number;
  minQuality?: number;
  preferredFormat?: 'image/jpeg' | 'image/png';
}

const DEFAULT_MAX_DIMENSION = 1800;
const DEFAULT_TARGET_BYTES = 900_000;
const DEFAULT_MIN_QUALITY = 0.45;

const isImageDataUrl = (value: string) => value.startsWith('data:image/');

export const estimateDataUrlBytes = (dataUrl: string): number => {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return dataUrl.length;
  const base64Length = dataUrl.length - comma - 1;
  return Math.ceil((base64Length * 3) / 4);
};

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Falha ao ler arquivo de imagem'));
    reader.readAsDataURL(file);
  });
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao processar imagem'));
    img.src = src;
  });
};

const getConstrainedSize = (width: number, height: number, maxDimension: number) => {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const ratio = width / height;
  if (width >= height) {
    return { width: maxDimension, height: Math.round(maxDimension / ratio) };
  }

  return { width: Math.round(maxDimension * ratio), height: maxDimension };
};

export async function optimizeImageDataUrl(dataUrl: string, options: OptimizeImageOptions = {}): Promise<string> {
  if (!isImageDataUrl(dataUrl)) return dataUrl;

  const originalBytes = estimateDataUrlBytes(dataUrl);
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const targetBytes = options.targetBytes ?? DEFAULT_TARGET_BYTES;
  const minQuality = options.minQuality ?? DEFAULT_MIN_QUALITY;

  if (originalBytes <= targetBytes) {
    return dataUrl;
  }

  const image = await loadImage(dataUrl);
  const constrained = getConstrainedSize(image.naturalWidth, image.naturalHeight, maxDimension);

  const canvas = document.createElement('canvas');
  canvas.width = constrained.width;
  canvas.height = constrained.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  ctx.clearRect(0, 0, constrained.width, constrained.height);
  ctx.drawImage(image, 0, 0, constrained.width, constrained.height);

  const preferredFormat = options.preferredFormat ?? 'image/jpeg';
  let quality = 0.82;
  let optimized = canvas.toDataURL(preferredFormat, quality);

  while (estimateDataUrlBytes(optimized) > targetBytes && preferredFormat === 'image/jpeg' && quality > minQuality) {
    quality = Math.max(minQuality, quality - 0.08);
    optimized = canvas.toDataURL('image/jpeg', quality);
    if (quality === minQuality) break;
  }

  return estimateDataUrlBytes(optimized) < originalBytes ? optimized : dataUrl;
}

export async function optimizeImageFile(
  file: File,
  options: OptimizeImageOptions & { preferPng?: boolean } = {}
): Promise<string> {
  const rawDataUrl = await readFileAsDataUrl(file);

  // Always keep PNG format for PNG files to preserve transparency
  const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
  const preferredFormat = isPng ? 'image/png' : (options.preferredFormat ?? 'image/jpeg');

  return optimizeImageDataUrl(rawDataUrl, {
    ...options,
    preferredFormat,
  });
}

export async function optimizeTemplatePagesForSave(
  pages: CanvasElement[][]
): Promise<{ pages: CanvasElement[][]; optimizedCount: number }> {
  let optimizedCount = 0;

  const optimizedPages = await Promise.all(
    pages.map(async (page) => {
      const nextPage = await Promise.all(
        page.map(async (el) => {
          if (!el.imageUrl || !isImageDataUrl(el.imageUrl)) return el;

          const sourceBytes = estimateDataUrlBytes(el.imageUrl);
          if (sourceBytes < 700_000) return el;

          const optimizedUrl = await optimizeImageDataUrl(el.imageUrl, {
            maxDimension: el.type === 'logo' ? 1400 : 1800,
            targetBytes: el.type === 'logo' ? 900_000 : 800_000,
            preferredFormat: el.type === 'logo' ? 'image/png' : 'image/jpeg',
          });

          if (optimizedUrl !== el.imageUrl) {
            optimizedCount += 1;
            return { ...el, imageUrl: optimizedUrl };
          }

          return el;
        })
      );

      return nextPage;
    })
  );

  return { pages: optimizedPages, optimizedCount };
}
