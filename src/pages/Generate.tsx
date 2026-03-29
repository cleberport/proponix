import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { getTemplateById, generatePdfFileName, addDocumentToHistory, getSettings } from '@/lib/templateStorage';
import { getTemplatePages, CanvasElement } from '@/types/template';
import { resolveAllValues, formatCurrency, formatEventDate } from '@/lib/calculations';
import { Template } from '@/types/template';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, FileText, Share2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Link2, Copy, Loader2, Check, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import CanvasRenderer from '@/components/editor/CanvasRenderer';
import DynamicTableInput, { DynamicRow } from '@/components/generate/DynamicTableInput';
import { generatePdfFromDom, generateVectorPdf } from '@/lib/pdfGenerator';
import { useIsMobile } from '@/hooks/use-mobile';
import DateRangePicker from '@/components/generate/DateRangePicker';
import { saveAllInputs, getInputHistory } from '@/lib/inputHistory';
import { supabase } from '@/integrations/supabase/client';
import ServiceSelector from '@/components/services/ServiceSelector';
import { Service } from '@/hooks/useServices';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const FORMULA_VAR_REGEX = /[a-zA-Z_][a-zA-Z0-9_]*/g;
const SAFE_FORMULA_TOKENS = new Set(['Math', 'min', 'max', 'round', 'floor', 'ceil', 'abs', 'pow']);

const extractFormulaDependencies = (calculatedFields: Record<string, string>): string[] => {
  const calculatedNames = new Set(Object.keys(calculatedFields));
  const deps = new Set<string>();

  for (const formula of Object.values(calculatedFields)) {
    const tokens = formula.match(FORMULA_VAR_REGEX) || [];
    for (const token of tokens) {
      if (SAFE_FORMULA_TOKENS.has(token)) continue;
      if (!calculatedNames.has(token)) deps.add(token);
    }
  }

  return [...deps];
};

const Generate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLDivElement>(null);
  const pdfPagesContainerRef = useRef<HTMLDivElement>(null);
  const pageRefsMap = useRef<Map<number, HTMLDivElement>>(new Map());

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

  // Service blocks state: map serviceIndex → selected service
  const [selectedServices, setSelectedServices] = useState<Record<number, Service | null>>({});

  // Extra dynamically added service blocks
  const [extraServiceIndices, setExtraServiceIndices] = useState<number[]>([]);

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

  // Detect service blocks in the template
  const templateServiceIndices = useMemo(() => {
    if (!template) return [];
    const pages = getTemplatePages(template);
    const indices: number[] = [];
    for (const page of pages) {
      for (const el of page) {
        if (el.type === 'service') {
          const idx = el.serviceIndex ?? 0;
          if (!indices.includes(idx)) indices.push(idx);
        }
      }
    }
    return indices.sort((a, b) => a - b);
  }, [template]);

  // All service indices = template ones + dynamically added extras
  const allServiceIndices = useMemo(() => {
    const all = [...templateServiceIndices, ...extraServiceIndices];
    return [...new Set(all)].sort((a, b) => a - b);
  }, [templateServiceIndices, extraServiceIndices]);

  const hasServices = allServiceIndices.length > 0;

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

  // Auto-sum table price column + service prices → feed into price
  useEffect(() => {
    let tableTotal = 0;
    if (hasTable && tableInfo) {
      const priceColIndex = tableInfo.headers.length - 1;
      tableTotal = tableRows.reduce((sum, row) => {
        const val = row.cells[priceColIndex] || '';
        const cleaned = val.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        return sum + (isFinite(num) ? num : 0);
      }, 0);
    }

    // Sum all selected service prices
    const servicesTotal = Object.values(selectedServices).reduce((sum, svc) => {
      return sum + (svc?.price || 0);
    }, 0);

    const combined = tableTotal + servicesTotal;
    setUserInputs((prev) => ({ ...prev, price: combined > 0 ? combined.toString() : (prev.price || '') }));
  }, [tableRows, hasTable, tableInfo, selectedServices]);

  useEffect(() => {
    let active = true;

    const loadTemplate = async () => {
      if (!id) {
        setTemplate(null);
        setLoadingTemplate(false);
        return;
      }

      setLoadingTemplate(true);
      const fetchedTemplateRaw = await getTemplateById(id);
      if (!active) return;

      let fetchedTemplate = fetchedTemplateRaw;

      // Starter templates follow global logo settings, without mutating shared objects.
      if (fetchedTemplateRaw?.id?.startsWith('template-')) {
        const s = getSettings();
        const ar = s.logoAspectRatio || 1;
        const pages = getTemplatePages(fetchedTemplateRaw).map((page) =>
          page.map((el) => {
            if (el.type !== 'logo') return { ...el };

            const origW = el.width;
            const origH = el.height;

            if (!s.logoUrl) {
              return { ...el, imageUrl: undefined, objectFit: 'contain' as const, width: origW, height: origH };
            }

            let fitW = origW;
            let fitH = Math.round(fitW / ar);
            if (fitH > origH) {
              fitH = origH;
              fitW = Math.round(fitH * ar);
            }

            return { ...el, imageUrl: s.logoUrl, objectFit: 'contain' as const, width: fitW, height: fitH };
          })
        );

        fetchedTemplate = {
          ...fetchedTemplateRaw,
          elements: pages[0] || [],
          pages,
        };
      }

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
        excluded.add('tax_rate');

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

        // Also collect source vars used by calculated formulas (e.g. "price")
        extractFormulaDependencies(fetchedTemplate.calculatedFields || {}).forEach((v) => usedVars.add(v));

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

    // Include vars referenced only in formulas (backward compatibility for older templates)
    vars.push(...extractFormulaDependencies(template.calculatedFields || {}));

    return vars;
  }, [template]);

  const calculatedFieldNames = Object.keys(template?.calculatedFields || {});
  const excludedFields = useMemo(() => {
    const base = new Set([...calculatedFieldNames, 'subtotal', 'tax', 'total', 'data_de_hoje']);
    base.add('tax_rate');
    if (hasTable) base.add('price');
    return base;
  }, [calculatedFieldNames, hasTable]);

  const inputFields = useMemo(() => {
    const seen = new Set<string>();
    const merged: string[] = [];

    const addField = (field: string) => {
      if (seen.has(field) || excludedFields.has(field)) return;
      seen.add(field);
      merged.push(field);
    };

    // Only show fields actually used in canvas or formulas
    const usedSet = new Set(allDynamicVars);
    (template?.inputFields || []).forEach((f) => { if (usedSet.has(f)) addField(f); });
    allDynamicVars.forEach(addField);

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
    // Inject service data
    for (const idx of allServiceIndices) {
      const svc = selectedServices[idx];
      if (svc) {
        display[`service_${idx}_name`] = svc.name;
        display[`service_${idx}_description`] = svc.description;
        display[`service_${idx}_price`] = formatCurrency(svc.price.toString());
        display[`service_${idx}_notes`] = svc.notes;
      }
    }
    return display;
  }, [resolvedValues, selectedServices, allServiceIndices]);

  // Build pages with dynamic table rows + extra service blocks injected
  const visiblePages = useMemo(() => {
    if (!template) return [[]];
    const templatePages = getTemplatePages(template);
    const result = templatePages.map((pageEls) =>
      pageEls
        .filter((el) => el.isVisible !== false)
        .map((el) => {
          if (el.type === 'table' && hasTable && tableInfo) {
            const dataRows = tableRows.filter((r) => r.cells.some((c) => c.trim()));
            const allRows = [
              { cells: tableInfo.headers },
              ...(dataRows.length > 0 ? dataRows : [{ cells: tableInfo.headers.map(() => '') }]),
            ];
            const rowHeight = 28;
            const newHeight = Math.max(el.height, allRows.length * rowHeight);
            return { ...el, rows: allRows, height: newHeight } as CanvasElement;
          }
          return el;
        })
    );

    // Add extra service blocks at the end of the last page
    if (extraServiceIndices.length > 0 && result.length > 0) {
      const lastPage = result[result.length - 1];
      // Find the last service element to position extras below
      const lastServiceEl = [...lastPage].reverse().find(e => e.type === 'service');
      const baseY = lastServiceEl ? lastServiceEl.y + lastServiceEl.height + 10 : 600;
      const baseEl = lastServiceEl || lastPage[0];

      extraServiceIndices.forEach((idx, i) => {
        if (templateServiceIndices.includes(idx)) return; // already in template
        result[result.length - 1] = [...result[result.length - 1], {
          id: `extra-service-${idx}`,
          type: 'service' as const,
          x: baseEl?.x ?? 40,
          y: baseY + i * 90,
          width: baseEl?.width ?? 300,
          height: 80,
          content: '',
          fontSize: baseEl?.fontSize ?? 14,
          fontWeight: '400',
          fontFamily: baseEl?.fontFamily ?? 'Space Grotesk',
          color: baseEl?.color ?? '#0F172A',
          alignment: 'left' as const,
          isVisible: true,
          serviceIndex: idx,
        }];
      });
    }

    return result;
  }, [template, tableRows, hasTable, tableInfo, extraServiceIndices, templateServiceIndices]);

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

      // Try DOM-based capture for pixel-perfect consistency
      let blob: Blob | null = null;
      const pageEls = Array.from(pageRefsMap.current.entries())
        .sort(([a], [b]) => a - b)
        .map(([, el]) => el)
        .filter(Boolean);

      if (pageEls.length === visiblePages.length && pageEls.length > 0) {
        try {
          blob = await generatePdfFromDom(pageEls, fileName, { skipDownload: true });
        } catch (e) {
          console.warn('[PDF] DOM capture failed, falling back to vector:', e);
        }
      }

      // Fallback to vector PDF
      if (!blob) {
        blob = await generateVectorPdf(visiblePages, displayValues, fileName, { backgroundColor: bgColor, skipDownload: true });
      }

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

      // Generate proposal link with custom validity
      const settings = getSettings();
      const validityDays = settings.proposalValidityDays || 5;
      const expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('proposal_links')
        .insert({ user_id: session.user.id, document_id: docId, expires_at: expiresAt } as any)
        .select()
        .single();

      if (error) throw error;

      const link = data as any;
      // Use edge function URL for sharing (dynamic OG tags for WhatsApp preview)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const ogUrl = `${supabaseUrl}/functions/v1/proposal-og?token=${link.token}`;
      setGeneratedLink(ogUrl);
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
    const message = encodeURIComponent(`Olá! Segue o orçamento para sua análise:\n${generatedLink}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
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
          <Button
            variant="outline"
            className="h-10 px-4 text-sm font-semibold"
            onClick={handleSendByLink}
            disabled={sendingLink}
          >
            {sendingLink ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Link2 className="mr-1.5 h-4 w-4" />}
            <span className="hidden sm:inline">{sendingLink ? 'Gerando...' : 'Enviar por link'}</span>
            <span className="sm:hidden">{sendingLink ? '...' : 'Link'}</span>
          </Button>
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

            {hasServices && (
              <div className="flex flex-col gap-3 pt-2 border-t border-border mt-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Serviços</Label>
                {allServiceIndices.map((idx) => (
                  <ServiceSelector
                    key={idx}
                    label={`Serviço ${idx + 1}`}
                    selectedServiceId={selectedServices[idx]?.id || ''}
                    onSelect={(svc) => setSelectedServices(prev => ({ ...prev, [idx]: svc }))}
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => {
                    const maxIdx = allServiceIndices.length > 0 ? Math.max(...allServiceIndices) : -1;
                    setExtraServiceIndices(prev => [...prev, maxIdx + 1]);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar serviço
                </Button>
              </div>
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
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-center border-b border-border bg-card p-4 shrink-0">
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
            <main className="flex flex-1 min-h-0 items-start justify-center overflow-auto bg-background p-2">
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
      {/* Hidden off-screen container for PDF capture — renders all pages at native resolution */}
      <div
        ref={pdfPagesContainerRef}
        aria-hidden
        style={{ position: 'fixed', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none', zIndex: -1 }}
      >
        {visiblePages.map((pageElements, idx) => (
          <div
            key={idx}
            ref={(el) => {
              if (el) pageRefsMap.current.set(idx, el);
              else pageRefsMap.current.delete(idx);
            }}
            style={{ width: 595, height: 842, overflow: 'hidden' }}
          >
            <CanvasRenderer
              elements={pageElements}
              selectedId={null}
              onSelect={() => {}}
              onUpdate={() => {}}
              readOnly
              variableValues={displayValues}
              showGrid={false}
              backgroundColor={template?.settings?.backgroundColor}
            />
          </div>
        ))}
      </div>
      {/* Link Modal */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Check className="h-5 w-5 text-primary" />
              Link gerado com sucesso!
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" className="w-full" onClick={handleCopyLink}>
              {linkCopied ? <Check className="mr-2 h-4 w-4 text-primary" /> : <Copy className="mr-2 h-4 w-4" />}
              {linkCopied ? 'Copiado!' : 'Copiar link'}
            </Button>
            <Button className="w-full bg-[#25D366] hover:bg-[#1da851] text-white" onClick={handleWhatsApp}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Generate;
