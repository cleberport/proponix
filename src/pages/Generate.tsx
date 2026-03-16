import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { getTemplateById, generatePdfFileName, addDocumentToHistory } from '@/lib/templateStorage';
import { getTemplatePages, CanvasElement } from '@/types/template';
import { resolveAllValues, formatCurrency, formatEventDate } from '@/lib/calculations';
import { Template } from '@/types/template';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, FileText, Share2, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import CanvasRenderer from '@/components/editor/CanvasRenderer';
import DynamicTableInput, { DynamicRow } from '@/components/generate/DynamicTableInput';
import { generateVectorPdf } from '@/lib/pdfGenerator';
import { useIsMobile } from '@/hooks/use-mobile';
import DateRangePicker from '@/components/generate/DateRangePicker';

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
  const [showPreview, setShowPreview] = useState(false);
  const [lastPdfBlob, setLastPdfBlob] = useState<Blob | null>(null);
  const [lastFileName, setLastFileName] = useState('');
  const [tableRows, setTableRows] = useState<DynamicRow[]>([]);

  // Find table element info from template
  const tableInfo = useMemo(() => {
    if (!template) return null;
    const pages = getTemplatePages(template);
    for (const page of pages) {
      for (const el of page) {
        if (el.type === 'table' && el.rows && el.rows.length > 0) {
          return { headers: el.rows[0].cells, elementId: el.id };
        }
      }
    }
    return null;
  }, [template]);

  const hasTable = !!tableInfo;

  // Keep preview closed on mobile and open on desktop
  useEffect(() => {
    setShowPreview(!isMobile);
  }, [isMobile]);

  // Initialize tableRows when tableInfo becomes available
  useEffect(() => {
    if (!tableInfo) return;
    setTableRows((prev) => {
      if (prev.length > 0) return prev;
      return [{ cells: tableInfo.headers.map(() => '') }];
    });
  }, [tableInfo]);

  // Auto-sum table price column → feed into price
  useEffect(() => {
    if (!hasTable || !tableInfo) return;
    const priceColIndex = tableInfo.headers.length - 1;
    const total = tableRows.reduce((sum, row) => {
      const val = row.cells[priceColIndex] || '';
      const cleaned = val.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
      const num = parseFloat(cleaned);
      return sum + (isFinite(num) ? num : 0);
    }, 0);
    setUserInputs((prev) => ({ ...prev, price: total > 0 ? total.toString() : '' }));
  }, [tableRows, hasTable, tableInfo]);

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
        const pages = getTemplatePages(fetchedTemplate);
        const calcFields = new Set(Object.keys(fetchedTemplate.calculatedFields || {}));
        const excluded = new Set([...calcFields, 'subtotal', 'tax', 'total', 'data_de_hoje']);

        // Check if template has a table - if so, exclude price from manual inputs
        let templateHasTable = false;
        for (const page of pages) {
          for (const el of page) {
            if (el.type === 'table' && el.rows && el.rows.length > 0) {
              templateHasTable = true;
              break;
            }
          }
          if (templateHasTable) break;
        }
        if (templateHasTable) excluded.add('price');

        (fetchedTemplate.inputFields || []).forEach((field) => {
          if (!excluded.has(field)) init[field] = '';
        });

        for (const page of pages) {
          for (const el of page) {
            if (
              el.isVisible !== false &&
              (el.type === 'dynamic-field' || el.type === 'price-field') &&
              el.variable &&
              !excluded.has(el.variable) &&
              !(el.variable in init)
            ) {
              init[el.variable] = '';
            }
          }
        }

        setUserInputs(init);
      }
    };

    void loadTemplate();

    return () => {
      active = false;
    };
  }, [id, editingDoc.values]);

  const allDynamicVars = useMemo(() => {
    if (!template) return [] as string[];
    const pages = getTemplatePages(template);
    const vars: string[] = [];
    for (const page of pages) {
      for (const el of page) {
        if (
          el.isVisible !== false &&
          (el.type === 'dynamic-field' || el.type === 'price-field') &&
          el.variable
        ) {
          vars.push(el.variable);
        }
      }
    }
    return vars;
  }, [template]);

  const calculatedFieldNames = Object.keys(template?.calculatedFields || {});
  const excludedFields = useMemo(() => {
    const base = new Set([...calculatedFieldNames, 'subtotal', 'tax', 'total', 'data_de_hoje']);
    if (hasTable) base.add('price');
    return base;
  }, [calculatedFieldNames, hasTable]);

  const inputFields = useMemo(() => {
    const baseFields = (template?.inputFields || []).filter((f) => !excludedFields.has(f));
    const seen = new Set(baseFields);
    const merged = [...baseFields];
    for (const v of allDynamicVars) {
      if (!seen.has(v) && !excludedFields.has(v)) {
        merged.push(v);
        seen.add(v);
      }
    }
    return merged;
  }, [template, allDynamicVars, excludedFields]);

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

  // Build pages with dynamic table rows injected
  const visiblePages = useMemo(() => {
    if (!template) return [[]];
    const templatePages = getTemplatePages(template);
    return templatePages.map((pageEls) =>
      pageEls
        .filter((el) => el.isVisible !== false)
        .map((el) => {
          if (el.type === 'table' && hasTable && tableInfo) {
            // Replace table rows with dynamic rows (keep headers)
            const dataRows = tableRows.filter((r) => r.cells.some((c) => c.trim()));
            const allRows = [
              { cells: tableInfo.headers },
              ...(dataRows.length > 0 ? dataRows : [{ cells: tableInfo.headers.map(() => '') }]),
            ];
            // Auto-adjust height based on row count
            const rowHeight = 28;
            const newHeight = Math.max(el.height, allRows.length * rowHeight);
            return { ...el, rows: allRows, height: newHeight } as CanvasElement;
          }
          return el;
        })
    );
  }, [template, tableRows, hasTable, tableInfo]);

  const visibleElements = visiblePages[0] || [];

  const [priceDisplay, setPriceDisplay] = useState('');
  const [priceFocused, setPriceFocused] = useState(false);

  useEffect(() => {
    if (!priceFocused && userInputs.price) {
      setPriceDisplay(formatCurrency(userInputs.price));
    }
  }, [userInputs.price, priceFocused]);

  const handleChange = (key: string, val: string) => {
    if (key === 'price') {
      setPriceDisplay(val);
      const cleaned = val.replace(/[^\d,.-]/g, '').trim();
      if (!cleaned) {
        setUserInputs((prev) => ({ ...prev, price: '' }));
        return;
      }
      const normalized = cleaned.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
      const parsed = Number.parseFloat(normalized);
      if (Number.isFinite(parsed)) {
        setUserInputs((prev) => ({ ...prev, price: parsed.toString() }));
      }
      return;
    }
    setUserInputs((prev) => ({ ...prev, [key]: val }));
  };

  const handlePriceBlur = () => {
    setPriceFocused(false);
    const val = userInputs.price;
    if (val && !isNaN(parseFloat(val))) {
      setPriceDisplay(formatCurrency(val));
    }
  };

  const getInputValue = (key: string) => {
    if (key === 'price') return priceDisplay;
    return userInputs[key] || '';
  };

  const handleGeneratePDF = useCallback(async () => {
    if (!template) return;
    setGenerating(true);
    if (isMobile) setShowPreview(false);
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

      // On mobile, open share sheet directly after generating
      if (blob && isMobile) {
        const file = new File([blob], fileName, { type: 'application/pdf' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: fileName });
          } catch (e: any) {
            if (e.name !== 'AbortError') {
              toast.error('Erro ao compartilhar');
            }
          }
          return;
        }
      }

      toast.success('PDF gerado com sucesso!');
    } catch {
      toast.error('Falha ao gerar PDF');
    } finally {
      setGenerating(false);
    }
  }, [template, userInputs, visiblePages, displayValues, isMobile]);

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
      price: 'R$ 5.000,00',
    };
    return p[v] || '';
  };

  const calculatedFields = template.calculatedFields || {};

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
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
          {lastPdfBlob && !isMobile && (
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
        <div className={`w-full md:w-80 overflow-y-auto border-b md:border-b-0 md:border-r border-border bg-card p-4 md:p-5 ${isMobile ? (showPreview ? 'hidden' : 'flex-1 min-h-0') : ''}`}>
          <div className="flex flex-col gap-4">
            {inputFields.map((v) => (
              <div key={v}>
                <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{formatLabel(v)}</Label>
                {v === 'event_date' ? (
                  <DateRangePicker
                    value={getInputValue(v)}
                    onChange={(val) => handleChange(v, val)}
                  />
                ) : (
                  <Input
                    value={getInputValue(v)}
                    onChange={(e) => handleChange(v, e.target.value)}
                    placeholder={getPlaceholder(v)}
                    className="h-12 text-base md:h-10 md:text-sm"
                    inputMode={v === 'price' ? 'numeric' : 'text'}
                    onFocus={v === 'price' ? () => setPriceFocused(true) : undefined}
                    onBlur={v === 'price' ? handlePriceBlur : undefined}
                  />
                )}
              </div>
            ))}

            {hasTable && tableInfo && (
              <DynamicTableInput
                headers={tableInfo.headers}
                rows={tableRows}
                onChange={setTableRows}
              />
            )}
          </div>

          {Object.keys(calculatedFields).length > 0 && (
            <div className="mt-5 rounded-lg border border-border bg-background p-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resumo</h3>
              {['subtotal', 'tax', 'total']
                .filter((field) => field in calculatedFields)
                .map((field) => (
                <div key={field} className={`flex items-center justify-between py-2 ${field === 'total' ? 'border-t border-border pt-2 mt-1' : ''}`}>
                    <span className="text-sm text-foreground">{formatLabel(field)}</span>
                    <span className={`text-sm font-semibold ${field === 'total' ? 'text-primary text-base' : 'text-foreground'}`}>
                      {displayValues[field] || 'R$ 0,00'}
                    </span>
                  </div>
                ))}
            </div>
          )}

        </div>

        {isMobile && !showPreview && (
          <div className="shrink-0 border-t border-border bg-card p-4">
            <Button
              variant="outline"
              className="w-full h-11 text-sm"
              onClick={() => setShowPreview(true)}
            >
              <ChevronDown className="mr-1.5 h-4 w-4" />
              Ver Prévia
            </Button>
          </div>
        )}

        {isMobile && showPreview && (
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-center border-b border-border bg-card p-4">
              <Button
                variant="outline"
                className="w-full h-11 text-sm"
                onClick={() => setShowPreview(false)}
              >
                <ChevronUp className="mr-1.5 h-4 w-4" />
                Ocultar Prévia
              </Button>
            </div>
            <main className="flex flex-1 items-start justify-center overflow-auto bg-background p-2">
              <div style={{ transform: `scale(${(window.innerWidth - 16) / 595})`, transformOrigin: 'top center', width: 595 }}>
                <CanvasRenderer
                  ref={canvasRef}
                  elements={visibleElements}
                  selectedId={null}
                  onSelect={() => {}}
                  onUpdate={() => {}}
                  readOnly
                  variableValues={displayValues}
                />
              </div>
            </main>
          </div>
        )}
        {!isMobile && (
          <main className="flex flex-1 items-start justify-center overflow-auto bg-background p-8">
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
