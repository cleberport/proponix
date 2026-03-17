import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'template-images';

/**
 * Convert a base64 data URL to a Blob using chunked processing
 * to avoid stack overflow with large images.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function getMimeExtension(dataUrl: string): string {
  if (dataUrl.startsWith('data:image/png')) return 'png';
  if (dataUrl.startsWith('data:image/webp')) return 'webp';
  return 'jpg';
}

/**
 * Upload a single data-URL image to storage.
 * Returns the public URL, or the original dataUrl on failure.
 */
export async function uploadImageToStorage(
  dataUrl: string,
  userId: string,
  templateId: string,
  elementId: string,
): Promise<string> {
  try {
    const ext = getMimeExtension(dataUrl);
    const path = `${userId}/${templateId}/${elementId}.${ext}`;
    const blob = dataUrlToBlob(dataUrl);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { upsert: true, contentType: blob.type });

    if (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      return dataUrl; // fallback
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return urlData.publicUrl;
  } catch (err) {
    console.error('Erro inesperado no upload de imagem:', err);
    return dataUrl; // fallback
  }
}

const isDataUrl = (v: string) => v.startsWith('data:image/');

/**
 * Process all pages: upload any data-URL images to storage,
 * replacing them with public URLs.
 */
export async function uploadPageImagesToStorage(
  pages: import('@/types/template').CanvasElement[][],
  userId: string,
  templateId: string,
): Promise<import('@/types/template').CanvasElement[][]> {
  const results = await Promise.all(
    pages.map(async (page) => {
      const updatedPage = await Promise.all(
        page.map(async (el) => {
          if (el.imageUrl && isDataUrl(el.imageUrl)) {
            const publicUrl = await uploadImageToStorage(
              el.imageUrl,
              userId,
              templateId,
              el.id,
            );
            return { ...el, imageUrl: publicUrl };
          }
          return el;
        }),
      );
      return updatedPage;
    }),
  );
  return results;
}
