import { useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileUp, Loader2, ArrowLeft, FileImage, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { saveTemplate } from '@/lib/templateStorage';
import { v4 as uuid } from 'uuid';
import { motion } from 'framer-motion';
import type { CanvasElement, Template } from '@/types/template';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const CANVAS_W = 595;
const MARGIN_LEFT = 40;
const CONTENT_W = 515;
const SPACING = 10;

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function pdfPageToBase64(file: File): Promise<{ base64: string; mime: string }> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const scale = 2;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return { base64: dataUrl.split(',')[1], mime: 'image/jpeg' };
}

// ── Layout builder: converts structured sections into positioned CanvasElements ──

interface AIElement {
  type?: string;
  content?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  alignment?: string;
  variable?: string;
  fieldCategory?: string;
  rows?: { cells: any[] }[];
  columnWidths?: number[];
}

interface AISection {
  type: string;
  elements: AIElement[];
}

function estimateHeight(el: AIElement): number {
  if (el.type === 'logo') return 60;
  if (el.type === 'divider') return 4;
  if (el.type === 'table' && el.rows) return el.rows.length * 26 + 8;
  if (el.type === 'notes') {
    const lines = Math.max(1, Math.ceil((el.content || '').length / 70));
    return lines * 18 + 12;
  }
  const fs = el.fontSize || 12;
  const lines = Math.max(1, Math.ceil((el.content || '').length / (CONTENT_W / (fs * 0.55))));
  return lines * (fs + 6) + 4;
}

function buildLayoutFromSections(sections: AISection[]): CanvasElement[] {
  const elements: CanvasElement[] = [];
  let cursorY = 30;

  for (const section of sections) {
    // Add section spacing
    if (section.type !== 'header') cursorY += 6;

    // Header: logo left, company info right on same row
    if (section.type === 'header') {
      const logoEl = section.elements.find(e => e.type === 'logo');
      const infoEls = section.elements.filter(e => e.type !== 'logo');

      if (logoEl) {
        elements.push(makeElement(logoEl, MARGIN_LEFT, cursorY, 160, 60));
      }

      let infoY = cursorY;
      for (const el of infoEls) {
        const h = estimateHeight(el);
        elements.push(makeElement(el, 220, infoY, CONTENT_W - 180, h));
        infoY += h + 2;
      }

      cursorY = Math.max(cursorY + 70, infoY) + SPACING;
      continue;
    }

    for (const el of section.elements) {
      const h = estimateHeight(el);
      elements.push(makeElement(el, MARGIN_LEFT, cursorY, CONTENT_W, h));
      cursorY += h + SPACING;
    }
  }

  return elements;
}

function normalizeCell(c: any): string {
  if (typeof c === 'object' && c !== null) return c.content ?? '';
  return String(c ?? '');
}

function makeElement(el: AIElement, x: number, y: number, w: number, h: number): CanvasElement {
  return {
    id: uuid(),
    type: (el.type as CanvasElement['type']) || 'text',
    x,
    y,
    width: w,
    height: h,
    content: el.content || '',
    variable: el.variable || undefined,
    fontSize: el.fontSize || 12,
    fontWeight: (el.fontWeight as 'normal' | 'bold') || 'normal',
    fontFamily: 'Inter',
    color: el.color || '#333333',
    alignment: (el.alignment as 'left' | 'center' | 'right') || 'left',
    fieldCategory: (el.fieldCategory as 'default' | 'input' | 'calculated') || 'default',
    defaultValue: '',
    rows: el.rows
      ? el.rows.map(r => ({ cells: (r.cells || []).map(normalizeCell) }))
      : undefined,
    columnWidths: el.columnWidths || undefined,
    isVisible: true,
  };
}

// ── UI ──

const STEPS = [
  'Enviando documento...',
  'Analisando conteúdo...',
  'Montando layout...',
  'Salvando template...',
];

const Import = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const processFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande. Máximo 10 MB.');
      return;
    }

    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    if (!isPdf && !isImage) {
      toast.error('Formato não suportado. Use PDF, JPG ou PNG.');
      return;
    }

    setProcessing(true);
    setStepIndex(0);

    try {
      let base64: string;
      let mime: string;

      if (isPdf) {
        const result = await pdfPageToBase64(file);
        base64 = result.base64;
        mime = result.mime;
      } else {
        base64 = await fileToBase64(file);
        mime = file.type;
      }

      setStepIndex(1);

      // Call AI — now returns structured sections, not positioned elements
      const { data, error } = await supabase.functions.invoke('analyze-proposal', {
        body: { imageBase64: base64, mimeType: mime },
      });

      if (error) throw new Error(error.message || 'Erro ao analisar documento');
      if (data?.error) throw new Error(data.error);

      setStepIndex(2);

      // Build layout from structured sections
      let elements: CanvasElement[];

      if (data.sections && Array.isArray(data.sections)) {
        // New structured format
        elements = buildLayoutFromSections(data.sections);
      } else if (data.elements && Array.isArray(data.elements)) {
        // Legacy format fallback — position sequentially
        const raw: CanvasElement[] = data.elements.map((el: any) => makeElement(
          el, MARGIN_LEFT, 0, el.width || CONTENT_W, estimateHeight(el)
        ));
        let y = 30;
        for (const el of raw) {
          el.y = y;
          y += el.height + SPACING;
        }
        elements = raw;
      } else {
        throw new Error('Resposta da IA não contém dados válidos');
      }

      setStepIndex(3);

      const variables = data.variables || [];
      const inputFields = data.inputFields || [];
      const calculatedFields = data.calculatedFields || {};

      const templateBase: Template = {
        id: uuid(),
        name: `Importado - ${file.name.replace(/\.[^.]+$/, '')}`,
        category: 'Importado',
        description: 'Template criado a partir de documento importado',
        thumbnail: '',
        elements,
        pages: [elements],
        variables,
        canvasWidth: CANVAS_W,
        canvasHeight: 842,
        inputFields,
        calculatedFields,
        defaultValues: {},
        settings: {
          taxRate: 0,
          showTax: false,
          backgroundColor: data.backgroundColor || '#ffffff',
        },
      };

      const saved = await saveTemplate(templateBase);
      toast.success('Seu modelo foi criado automaticamente. Revise e ajuste se necessário.');
      navigate(`/editor/${saved.id}`);
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error(err.message || 'Erro ao processar documento');
    } finally {
      setProcessing(false);
      setStepIndex(0);
    }
  }, [navigate]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) void processFile(file);
    },
    [processFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void processFile(file);
      if (inputRef.current) inputRef.current.value = '';
    },
    [processFile],
  );

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-lg">
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Voltar
        </Button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-xl font-semibold text-foreground md:text-2xl">
            Importar minha proposta
          </h1>
          <p className="mb-8 text-sm text-muted-foreground">
            Envie um PDF ou imagem e transforme em template editável automaticamente.
          </p>

          {processing ? (
            <div className="flex flex-col items-center gap-6 rounded-xl border border-border bg-card p-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="space-y-3 text-center">
                {STEPS.map((label, i) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2 text-sm transition-opacity ${
                      i <= stepIndex ? 'text-foreground opacity-100' : 'text-muted-foreground opacity-40'
                    }`}
                  >
                    {i < stepIndex ? (
                      <span className="text-primary">✓</span>
                    ) : i === stepIndex ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    ) : (
                      <span className="h-3.5 w-3.5" />
                    )}
                    {label}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`group flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed p-10 transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Arraste e solte seu documento aqui
                </p>
                <p className="mt-1 text-xs text-muted-foreground">ou clique para selecionar</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> PDF
                </span>
                <span className="flex items-center gap-1">
                  <FileImage className="h-3.5 w-3.5" /> JPG / PNG
                </span>
              </div>
              <Button variant="outline" size="sm" className="mt-2">
                <FileUp className="mr-1.5 h-4 w-4" />
                Selecionar arquivo
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Import;
