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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** For PDFs we render the first page to a canvas and return as JPEG base64. */
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

const STEPS = [
  'Enviando documento...',
  'Analisando layout...',
  'Detectando campos...',
  'Reconstruindo template...',
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

      // Step 1: convert
      if (isPdf) {
        const result = await pdfPageToBase64(file);
        base64 = result.base64;
        mime = result.mime;
      } else {
        base64 = await fileToBase64(file);
        mime = file.type;
      }

      setStepIndex(1);

      // Step 2: send to AI
      const { data, error } = await supabase.functions.invoke('analyze-proposal', {
        body: { imageBase64: base64, mimeType: mime },
      });

      if (error) throw new Error(error.message || 'Erro ao analisar documento');
      if (data?.error) throw new Error(data.error);

      setStepIndex(2);

      // Step 3: build elements
      const aiElements: any[] = data.elements || [];
      const elements: CanvasElement[] = aiElements.map((el: any) => ({
        id: uuid(),
        type: el.type || 'text',
        x: Math.max(0, Math.min(el.x || 0, 595)),
        y: Math.max(0, Math.min(el.y || 0, 842)),
        width: Math.max(20, el.width || 200),
        height: Math.max(10, el.height || 24),
        content: el.content || '',
        variable: el.variable || undefined,
        fontSize: el.fontSize || 12,
        fontWeight: el.fontWeight || 'normal',
        fontFamily: el.fontFamily || 'Inter',
        color: el.color || '#333333',
        alignment: el.alignment || 'left',
        fieldCategory: el.fieldCategory || 'default',
        defaultValue: el.defaultValue || '',
        rows: el.rows || undefined,
        columnWidths: el.columnWidths || undefined,
        isVisible: true,
      }));

      setStepIndex(3);

      // Step 4: save as template
      const variables = data.variables || [];
      const inputFields = data.inputFields || [];
      const calculatedFields = data.calculatedFields || {};
      const defaultValues = data.defaultValues || {};

      const templateBase: Template = {
        id: uuid(),
        name: `Importado - ${file.name.replace(/\.[^.]+$/, '')}`,
        category: 'Importado',
        description: 'Template criado a partir de documento importado',
        thumbnail: '',
        elements,
        pages: [elements],
        variables,
        canvasWidth: 595,
        canvasHeight: 842,
        inputFields,
        calculatedFields,
        defaultValues,
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
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
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
