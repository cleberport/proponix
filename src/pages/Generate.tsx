import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { getTemplateById, generatePdfFileName, addDocumentToHistory } from '@/lib/templateStorage';
import { getTemplatePages, CanvasElement } from '@/types/template';
import { resolveAllValues, formatCurrency, formatEventDate } from '@/lib/calculations';
import { Template } from '@/types/template';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, FileText, Share2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Link2, Copy, ExternalLink, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import CanvasRenderer from '@/components/editor/CanvasRenderer';
import DynamicTableInput, { DynamicRow } from '@/components/generate/DynamicTableInput';
import { generateVectorPdf } from '@/lib/pdfGenerator';
import { useIsMobile } from '@/hooks/use-mobile';
import DateRangePicker from '@/components/generate/DateRangePicker';
import { saveAllInputs, getInputHistory } from '@/lib/inputHistory';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

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
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [sendingLink, setSendingLink] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

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

        // Collect all variables actually used in the canvas
        const usedVars = new Set<string>();
        const varPattern = /\{\{(\w+)\}\}/g;
        for (const page of pages) {
          for (const el of page) {
            if (el.isVisible === false) continue;
            if ((el.type === 'dynamic-field' || el.type === 'price-field') && el.variable) {
              usedVars.add(el.variable);
            }
            if ((el.type === 'text' || el.type === 'notes') && el.content) {
              let match: RegExpExecArray | null;
              while ((match = varPattern.exec(el.content)) !== null) {
                usedVars.add(match[1]);
              }
            }
          }
        }

        // Only initialize inputs for variables actually used in the canvas
        (fetchedTemplate.inputFields || []).forEach((field) => {
          if (!excluded.has(field) && usedVars.has(field)) init[field] = '';
        });

        for (const v of usedVars) {
          if (!excluded.has(v) && !(v in init)) {
            init[v] = '';
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
    const varPattern = /\{\{(\w+)\}\}/g;
    for (const page of pages) {
      for (const el of page) {
        if (el.isVisible === false) continue;
        // Collect variables from dynamic-field and price-field elements
        if (
          (el.type === 'dynamic-field' || el.type === 'price-field') &&
          el.variable
        ) {
          vars.push(el.variable);
        }
        // Also scan text/notes content for {{variable}} references
        if ((el.type === 'text' || el.type === 'notes') && el.content) {
          let match: RegExpExecArray | null;
          while ((match = varPattern.exec(el.content)) !== null) {
            vars.push(match[1]);
          }
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
    // Only show input fields that are actually used by dynamic elements in the template
    const dynamicSet = new Set(allDynamicVars);
    const baseFields = (template?.inputFields || []).filter((f) => !excludedFields.has(f) && dynamicSet.has(f));
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

  // Map each variable to the page index where it first appears
  const fieldToPage = useMemo(() => {
    const map: Record<string, number> = {};
    if (!template) return map;
    const pages = getTemplatePages(template);
    const varPattern = /\{\{(\w+)\}\}/g;
    pages.forEach((pageEls, pageIdx) => {
      for (const el of pageEls) {
        if (el.isVisible === false) continue;
        if ((el.type === 'dynamic-field' || el.type === 'price-field') && el.variable && !(el.variable in map)) {
          map[el.variable] = pageIdx;
        }
        if (el.type === 'table' && !('__table__' in map)) {
          map['__table__'] = pageIdx;
        }
        if ((el.type === 'text' || el.type === 'notes') && el.content) {
          let match: RegExpExecArray | null;
          while ((match = varPattern.exec(el.content)) !== null) {
            if (!(match[1] in map)) map[match[1]] = pageIdx;
          }
        }
      }
    });
    return map;
  }, [template]);

  // Map each variable to the element id on its page for highlighting
  const fieldToElementId = useMemo(() => {
    const map: Record<string, string> = {};
    if (!template) return map;
    const pages = getTemplatePages(template);
    for (const pageEls of pages) {
      for (const el of pageEls) {
        if (el.isVisible === false) continue;
        if ((el.type === 'dynamic-field' || el.type === 'price-field') && el.variable && !(el.variable in map)) {
          map[el.variable] = el.id;
        }
        if (el.type === 'table' && !('__table__' in map)) {
          map['__table__'] = el.id;
        }
      }
    }
    return map;
  }, [template]);

  const totalPages = visiblePages.length;
  const currentPageElements = visiblePages[activePageIndex] || [];

  // Auto-switch page when a field is focused
  const handleFieldFocus = useCallback((fieldName: string) => {
    setFocusedField(fieldName);
    if (fieldName === 'price') {
      setPriceFocused(true);
    }
    const pageIdx = fieldToPage[fieldName];
    if (pageIdx !== undefined && pageIdx !== activePageIndex) {
      setActivePageIndex(pageIdx);
    }
  }, [fieldToPage, activePageIndex]);

  const handleFieldBlur = useCallback((fieldName: string) => {
    setFocusedField(null);
    if (fieldName === 'price') {
      handlePriceBlur();
    }
  }, []);

  // The element id to highlight in the preview
  const highlightedElementId = focusedField ? fieldToElementId[focusedField] ?? null : null;

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
      const bgColor = template?.settings?.backgroundColor;
      const blob = await generateVectorPdf(visiblePages, displayValues, fileName, { backgroundColor: bgColor });

      setLastPdfBlob(blob || null);
      setLastFileName(fileName);

      // Save inputs to history for future autocomplete
      saveAllInputs(userInputs);

      addDocumentToHistory({
        id: crypto.randomUUID(),
        templateId: template.id,
        templateName: template.name,
        clientName: userInputs.client_name || '',
        fileName,
        generatedAt: new Date().toISOString(),
        values: { ...userInputs },
      });

      // Mobile: open share sheet; Desktop: download directly
      if (blob) {
        if (isMobile) {
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
        // Desktop or fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
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

  const handleSendByLink = useCallback(async () => {
    if (!template) return;
    setSendingLink(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Você precisa estar logado'); return; }

      const fileName = generatePdfFileName();
      const docId = crypto.randomUUID();

      // Save document to history
      saveAllInputs(userInputs);
      addDocumentToHistory({
        id: docId,
        templateId: template.id,
        templateName: template.name,
        clientName: userInputs.client_name || '',
        fileName,
        generatedAt: new Date().toISOString(),
        values: { ...userInputs },
      });

      // Generate proposal link
      const { data, error } = await supabase
        .from('proposal_links')
        .insert({ user_id: session.user.id, document_id: docId } as any)
        .select()
        .single();

      if (error) throw error;

      const link = data as any;
      const url = `${window.location.origin}/p/${link.token}`;
      setGeneratedLink(url);
      setLinkCopied(false);
      setLinkModalOpen(true);

      // Update status
      await supabase
        .from('generated_documents')
        .update({ status: 'enviado' } as any)
        .eq('id', docId);

      toast.success('Link gerado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar link');
    } finally {
      setSendingLink(false);
    }
  }, [template, userInputs]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(generatedLink);
    setLinkCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Olá! Segue o orçamento para sua análise: ${generatedLink}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

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
          <Button className="h-10 px-4 text-sm font-semibold" onClick={handleGeneratePDF} disabled={generating}>
            <Download className="mr-1.5 h-4 w-4" />
            {generating ? 'Gerando...' : 'Gerar PDF'}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <div className={`w-full md:w-80 overflow-y-auto border-b md:border-b-0 md:border-r border-border bg-card p-4 md:p-5 ${isMobile ? (showPreview ? 'hidden' : 'flex-1 min-h-0') : ''}`}>
          <div className="flex flex-col gap-4">
            {inputFields.map((v) => {
              const suggestions = getInputHistory(v);
              const listId = `suggestions-${v}`;
              return (
                <div key={v}>
                  <Label className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{formatLabel(v)}</Label>
                  {v === 'event_date' ? (
                    <DateRangePicker
                      value={getInputValue(v)}
                      onChange={(val) => handleChange(v, val)}
                    />
                  ) : (
                    <>
                      <Input
                        value={getInputValue(v)}
                        onChange={(e) => handleChange(v, e.target.value)}
                        placeholder={getPlaceholder(v)}
                        className="h-12 text-base md:h-10 md:text-sm"
                        inputMode={v === 'price' ? 'numeric' : 'text'}
                        onFocus={() => handleFieldFocus(v)}
                        onBlur={() => handleFieldBlur(v)}
                        list={suggestions.length > 0 ? listId : undefined}
                        autoComplete="off"
                      />
                      {suggestions.length > 0 && (
                        <datalist id={listId}>
                          {suggestions.map((s, i) => (
                            <option key={i} value={s} />
                          ))}
                        </datalist>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {hasTable && tableInfo && (
              <DynamicTableInput
                headers={tableInfo.headers}
                rows={tableRows}
                onChange={setTableRows}
                onFocus={() => handleFieldFocus('__table__')}
                onBlur={() => handleFieldBlur('__table__')}
              />
            )}
          </div>


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
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 border-b border-border bg-card px-4 py-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={activePageIndex === 0} onClick={() => setActivePageIndex((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-foreground">Página {activePageIndex + 1} / {totalPages}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={activePageIndex === totalPages - 1} onClick={() => setActivePageIndex((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            <main className="flex flex-1 items-start justify-center overflow-auto bg-background p-2">
              <div style={{ transform: `scale(${(window.innerWidth - 16) / 595})`, transformOrigin: 'top center', width: 595 }}>
                <div className="relative">
                  <CanvasRenderer
                    ref={canvasRef}
                    elements={currentPageElements}
                    selectedId={null}
                    onSelect={() => {}}
                    onUpdate={() => {}}
                    readOnly
                    variableValues={displayValues}
                    backgroundColor={template?.settings?.backgroundColor}
                  />
                  {highlightedElementId && currentPageElements.find(el => el.id === highlightedElementId) && (() => {
                    const el = currentPageElements.find(e => e.id === highlightedElementId)!;
                    return (
                      <div
                        className="absolute pointer-events-none rounded-sm transition-all duration-300"
                        style={{
                          left: el.x - 3,
                          top: el.y - 3,
                          width: el.width + 6,
                          height: el.height + 6,
                          boxShadow: '0 0 0 2px hsl(var(--primary) / 0.5), 0 0 12px 2px hsl(var(--primary) / 0.2)',
                        }}
                      />
                    );
                  })()}
                </div>
              </div>
            </main>
          </div>
        )}
        {!isMobile && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 border-b border-border bg-card px-4 py-2 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={activePageIndex === 0} onClick={() => setActivePageIndex((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-foreground">Página {activePageIndex + 1} / {totalPages}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={activePageIndex === totalPages - 1} onClick={() => setActivePageIndex((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            <main className="flex flex-1 items-start justify-center overflow-auto bg-background p-8">
              <div className="relative">
                <CanvasRenderer
                  ref={canvasRef}
                  elements={currentPageElements}
                  selectedId={null}
                  onSelect={() => {}}
                  onUpdate={() => {}}
                  readOnly
                  variableValues={displayValues}
                  backgroundColor={template?.settings?.backgroundColor}
                />
                {highlightedElementId && currentPageElements.find(el => el.id === highlightedElementId) && (() => {
                  const el = currentPageElements.find(e => e.id === highlightedElementId)!;
                  return (
                    <div
                      className="absolute pointer-events-none rounded-sm transition-all duration-300"
                      style={{
                        left: el.x - 3,
                        top: el.y - 3,
                        width: el.width + 6,
                        height: el.height + 6,
                        boxShadow: '0 0 0 2px hsl(var(--primary) / 0.5), 0 0 12px 2px hsl(var(--primary) / 0.2)',
                      }}
                    />
                  );
                })()}
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
};

export default Generate;
