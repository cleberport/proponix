import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { getTemplateById, generatePdfFileName, addDocumentToHistory } from '@/lib/templateStorage';
import { getTemplatePages } from '@/types/template';
import { resolveAllValues, formatCurrency, formatEventDate } from '@/lib/calculations';
import { Template } from '@/types/template';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, FileText, Share2, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import CanvasRenderer from '@/components/editor/CanvasRenderer';
import { generateVectorPdf } from '@/lib/pdfGenerator';
import { useIsMobile } from '@/hooks/use-mobile';

const Generate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLDivElement>(null);

  const editingDoc = useMemo(() => {
    return (location.state as { documentId?: string; values?: Record<string, string> }) || {};
  }, [location.state]);

  const [template, setTemplate] = useState<Template | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(!isMobile);
  const [lastPdfBlob, setLastPdfBlob] = useState<Blob | null>(null);
  const [lastFileName, setLastFileName] = useState('');

  useEffect(() => {
    let active = true;

    const loadTemplate = async () => {
      if (!id) {
        setTemplate(null);
        setLoadingTemplate(false);
        return;
      }

      setLoadingTemplate(true);
      const fetchedTemplate = await getTemplateById(id);
      if (!active) return;

      setTemplate(fetchedTemplate || null);
      setLoadingTemplate(false);

      if (!fetchedTemplate) return;

      if (editingDoc.values) {
        setUserInputs({ ...editingDoc.values });
      } else {
        const init: Record<string, string> = {};
        (fetchedTemplate.inputFields || []).forEach((field) => {
          init[field] = '';
        });
        setUserInputs(init);
      }
    };

    void loadTemplate();

    return () => {
      active = false;
    };
  }, [id, editingDoc.values]);

  const calculatedFieldNames = Object.keys(template?.calculatedFields || {});
  const inputFields = (template?.inputFields || []).filter(
    (f) => !calculatedFieldNames.includes(f) && !['subtotal', 'tax', 'total'].includes(f)
  );

  const resolvedValues = useMemo(() => {
    if (!template) return {};
    const inputs = { ...userInputs };
    if (inputs.event_date) inputs.event_date = formatEventDate(inputs.event_date);
    return resolveAllValues(template, inputs);
  }, [template, userInputs]);

  const displayValues = useMemo(() => {
    const display = { ...resolvedValues };
    const currencyFields = ['price', 'subtotal', 'tax', 'total'];
    for (const f of currencyFields) {
      if (display[f] && !isNaN(parseFloat(display[f]))) {
        display[f] = formatCurrency(display[f]);
      }
    }
    return display;
  }, [resolvedValues]);

  const visiblePages = useMemo(() => {
    if (!template) return [[]];
    const templatePages = getTemplatePages(template);
    return templatePages.map((pageEls) => pageEls.filter((el) => el.isVisible !== false));
  }, [template]);

  // First page elements for preview
  const visibleElements = visiblePages[0] || [];

  const parsePriceInput = (value: string): string => {
    const cleaned = value.replace(/[^\d,.-]/g, '').trim();
    if (!cleaned) return '';

    const hasDecimalSeparator = cleaned.includes(',') || cleaned.includes('.');

    if (!hasDecimalSeparator) {
      const onlyDigits = cleaned.replace(/\D/g, '');
      if (!onlyDigits) return '';
      return String(Number(onlyDigits));
    }

    const normalized = cleaned.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed.toString() : '';
  };

  const handleChange = (key: string, val: string) => {
    if (key === 'price') {
      setUserInputs((prev) => ({ ...prev, [key]: parsePriceInput(val) }));
      return;
    }

    setUserInputs((prev) => ({ ...prev, [key]: val }));
  };

  const getInputValue = (key: string) => {
    const value = userInputs[key] || '';
    if (key !== 'price' || !value) return value;
    return formatCurrency(value);
  };

  const handleGeneratePDF = useCallback(async () => {
    if (!template) return;
    setGenerating(true);
    try {
      const fileName = generatePdfFileName();
      const blob = await generateVectorPdf(visiblePages, displayValues, fileName);

      setLastPdfBlob(blob || null);
      setLastFileName(fileName);

      addDocumentToHistory({
        id: crypto.randomUUID(),
        templateId: template.id,
        templateName: template.name,
        clientName: userInputs.client_name || '',
        fileName,
        generatedAt: new Date().toISOString(),
        values: { ...userInputs },
      });

      toast.success('PDF gerado com sucesso!');
    } catch {
      toast.error('Falha ao gerar PDF');
    } finally {
      setGenerating(false);
    }
  }, [template, userInputs, visiblePages, displayValues]);

  const handleShare = async () => {
    if (!lastPdfBlob) {
      toast.error('Gere o PDF primeiro');
      return;
    }
    const file = new File([lastPdfBlob], lastFileName, { type: 'application/pdf' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: lastFileName });
      } catch (e: any) {
        if (e.name !== 'AbortError') toast.error('Erro ao compartilhar');
      }
    } else {
      const url = URL.createObjectURL(lastPdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = lastFileName;
      a.click();
      URL.revokeObjectURL(url);
      toast.info('Compartilhamento não suportado, PDF baixado');
    }
  };

  if (loadingTemplate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Template não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const formatLabel = (v: string) => {
    const labels: Record<string, string> = {
      client_name: 'Cliente', event_name: 'Evento', location: 'Local',
      event_date: 'Data', service_name: 'Serviço', price: 'Preço',
      tax_rate: 'Imposto', subtotal: 'Subtotal', tax: 'Imposto', total: 'Total',
      notes_text: 'Observações', data_de_hoje: 'Data de Hoje',
    };
    return labels[v] || v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getPlaceholder = (v: string) => {
    const p: Record<string, string> = {
      client_name: 'Nome do cliente',
      event_name: 'Nome do evento',
      location: 'Local do evento',
      event_date: '23/04/2026 ou 23/04 a 25/04/2026',
      price: '5000',
    };
    return p[v] || '';
  };

  const calculatedFields = template.calculatedFields || {};

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card px-3 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-1.5">
            <FileText className="hidden h-4 w-4 text-primary sm:block" />
            <span className="text-sm font-semibold text-foreground truncate max-w-[140px] sm:max-w-none">{template.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastPdfBlob && (
            <Button variant="outline" size="icon" className="h-10 w-10" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          )}
          <Button className="h-10 px-4 text-sm font-semibold" onClick={handleGeneratePDF} disabled={generating}>
            <Download className="mr-1.5 h-4 w-4" />
            {generating ? 'Gerando...' : 'Gerar PDF'}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <div className="w-full md:w-80 overflow-y-auto border-b md:border-b-0 md:border-r border-border bg-card p-4 md:p-5">
          <div className="flex flex-col gap-4">
            {inputFields.map((v) => (
              <div key={v}>
                <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{formatLabel(v)}</Label>
                <Input
                  value={userInputs[v] || ''}
                  onChange={(e) => handleChange(v, e.target.value)}
                  placeholder={getPlaceholder(v)}
                  className="h-12 text-base md:h-10 md:text-sm"
                  inputMode={v === 'price' ? 'decimal' : 'text'}
                />
                {v === 'event_date' && (
                  <p className="mt-1 text-[10px] text-muted-foreground">Aceita data única ou intervalo</p>
                )}
              </div>
            ))}
          </div>

          {Object.keys(calculatedFields).length > 0 && (
            <div className="mt-5 rounded-lg border border-border bg-background p-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resumo</h3>
              {Object.entries(calculatedFields)
                .filter(([field]) => showTax || field !== 'tax')
                .map(([field]) => (
                  <div key={field} className={`flex items-center justify-between py-2 ${field === 'total' ? 'border-t border-border pt-2 mt-1' : ''}`}>
                    <span className="text-sm text-foreground">{formatLabel(field)}</span>
                    <span className={`text-sm font-semibold ${field === 'total' ? 'text-primary text-base' : 'text-foreground'}`}>
                      {displayValues[field] || 'R$ 0,00'}
                    </span>
                  </div>
                ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between rounded-lg border border-border px-3 py-3">
            <div className="flex items-center gap-2">
              {showTax ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              <span className="text-xs font-medium text-foreground">Mostrar imposto</span>
            </div>
            <Switch checked={showTax} onCheckedChange={setShowTax} />
          </div>

          {isMobile && (
            <Button
              variant="outline"
              className="mt-4 w-full h-11 text-sm"
              onClick={() => setShowPreview((p) => !p)}
            >
              {showPreview ? <ChevronDown className="mr-1.5 h-4 w-4" /> : <ChevronUp className="mr-1.5 h-4 w-4" />}
              {showPreview ? 'Ocultar Prévia' : 'Ver Prévia'}
            </Button>
          )}

          {isMobile && lastPdfBlob && (
            <div className="mt-4 flex flex-col gap-2">
              <Button className="w-full h-12 text-base font-semibold" onClick={handleShare}>
                <Share2 className="mr-2 h-5 w-5" />
                Compartilhar
              </Button>
            </div>
          )}
        </div>

        {(!isMobile || showPreview) && (
          <main className="flex flex-1 items-start justify-center overflow-auto bg-background p-4 md:p-8">
            <CanvasRenderer
              ref={canvasRef}
              elements={visibleElements}
              selectedId={null}
              onSelect={() => {}}
              onUpdate={() => {}}
              readOnly
              variableValues={displayValues}
            />
          </main>
        )}
      </div>
    </div>
  );
};

export default Generate;
