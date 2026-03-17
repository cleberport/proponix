import { useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getTemplateById, saveTemplate, getSettings } from '@/lib/templateStorage';
import { decimalToPercent, percentToDecimal } from '@/lib/calculations';
import { CanvasElement, ElementType, ELEMENT_PALETTE, DEFAULT_VARIABLES, Template, TemplateSettings, DEFAULT_TEMPLATE_VALUES, DEFAULT_CALCULATED_FIELDS, TEMPLATE_COLORS, getTemplatePages } from '@/types/template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Play, Plus, GripVertical, Settings2, Trash2, Copy, AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyCenter, AlignHorizontalJustifyCenter, AlignStartVertical, AlignEndVertical, AlignStartHorizontal, AlignEndHorizontal, Grid3X3, ZoomIn, ZoomOut, Paintbrush, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { toast } from 'sonner';
import CanvasRenderer from '@/components/editor/CanvasRenderer';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { optimizeTemplatePagesForSave } from '@/lib/imageOptimization';
import { supabase } from '@/integrations/supabase/client';

const GRID = 10;
const isUuid = (value: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const Editor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLDivElement>(null);

  const isNew = id === 'new';
  const [loadingTemplate, setLoadingTemplate] = useState(!isNew);
  const [baseCategory, setBaseCategory] = useState('Custom');
  const [baseDescription, setBaseDescription] = useState('Template personalizado');

  const [templateName, setTemplateName] = useState('Template sem título');
  // Multi-page state
  const [pages, setPages] = useState<CanvasElement[][]>([[]]);
  const [currentPage, setCurrentPage] = useState(0);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newVar, setNewVar] = useState('');
  const [variables, setVariables] = useState<string[]>([...DEFAULT_VARIABLES]);
  const [defaultValues, setDefaultValues] = useState<Record<string, string>>({ ...DEFAULT_TEMPLATE_VALUES });
  const [inputFields, setInputFields] = useState<string[]>(['client_name', 'event_name', 'location', 'event_date']);
  const [calculatedFields, setCalculatedFields] = useState<Record<string, string>>({ ...DEFAULT_CALCULATED_FIELDS });
  const [settings, setSettings] = useState<TemplateSettings>({ taxRate: 0.10, showTax: true });
  const [templateColor, setTemplateColor] = useState(TEMPLATE_COLORS[Math.floor(Math.random() * TEMPLATE_COLORS.length)]);
  const [mobileTab, setMobileTab] = useState<'canvas' | 'properties'>('canvas');
  const [showMobileElements, setShowMobileElements] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [canvasBgColor, setCanvasBgColor] = useState('#ffffff');

  const BG_PRESETS = ['#ffffff', '#f8fafc', '#f1f5f9', '#fef3c7', '#fce7f3', '#e0e7ff', '#d1fae5', '#1e293b', '#0f172a'];

  // Current page elements
  const elements = pages[currentPage] || [];
  const setElements = useCallback((updater: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => {
    setPages(prev => {
      const newPages = [...prev];
      if (typeof updater === 'function') {
        newPages[currentPage] = updater(newPages[currentPage] || []);
      } else {
        newPages[currentPage] = updater;
      }
      return newPages;
    });
  }, [currentPage]);

  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const selectedElement = selectedId ? elements.find((e) => e.id === selectedId) || null : null;

  useEffect(() => {
    let active = true;

    if (isNew) {
      setLoadingTemplate(false);
      return () => { active = false; };
    }

    const loadTemplate = async () => {
      setLoadingTemplate(true);
      const existing = await getTemplateById(id!);
      if (!active) return;

      if (!existing) {
        toast.error('Template não encontrado');
        navigate('/dashboard', { replace: true });
        return;
      }

      setBaseCategory(existing.category || 'Custom');
      setBaseDescription(existing.description || 'Template personalizado');
      setTemplateName(existing.name || 'Template sem título');
      setPages(getTemplatePages(existing));
      setCurrentPage(0);
      setVariables(existing.variables?.length ? existing.variables : [...DEFAULT_VARIABLES]);
      setDefaultValues(existing.defaultValues || { ...DEFAULT_TEMPLATE_VALUES });
      setInputFields(existing.inputFields || ['client_name', 'event_name', 'location', 'event_date']);
      setCalculatedFields(existing.calculatedFields || { ...DEFAULT_CALCULATED_FIELDS });
      const loadedSettings = existing.settings || { taxRate: 0.10, showTax: true };
      setSettings(loadedSettings);
      setCanvasBgColor(loadedSettings.backgroundColor || '#ffffff');
      setTemplateColor(existing.color || TEMPLATE_COLORS[Math.floor(Math.random() * TEMPLATE_COLORS.length)]);
      setLoadingTemplate(false);
    };

    void loadTemplate();
    return () => { active = false; };
  }, [id, isNew, navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      if (selectedIds.length > 0) {
        const step = e.shiftKey ? 50 : GRID;
        // Check if any selected element is locked
        const currentElements = pages[currentPage] || [];
        const hasLocked = selectedIds.some(id => currentElements.find(el => el.id === id)?.locked);
        
        switch (e.key) {
          case 'Delete':
          case 'Backspace':
            e.preventDefault();
            setElements((prev) => prev.filter((el) => !selectedIds.includes(el.id)));
            setSelectedIds([]);
            return;
          case 'ArrowUp':
            e.preventDefault();
            if (!hasLocked) setElements((prev) => prev.map((el) => selectedIds.includes(el.id) ? { ...el, y: Math.max(0, el.y - step) } : el));
            return;
          case 'ArrowDown':
            e.preventDefault();
            if (!hasLocked) setElements((prev) => prev.map((el) => selectedIds.includes(el.id) ? { ...el, y: el.y + step } : el));
            return;
          case 'ArrowLeft':
            e.preventDefault();
            if (!hasLocked) setElements((prev) => prev.map((el) => selectedIds.includes(el.id) ? { ...el, x: Math.max(0, el.x - step) } : el));
            return;
          case 'ArrowRight':
            e.preventDefault();
            if (!hasLocked) setElements((prev) => prev.map((el) => selectedIds.includes(el.id) ? { ...el, x: el.x + step } : el));
            return;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, setElements]);

  const handleSelect = useCallback((id: string | null) => {
    if (id) setSelectedIds([id]);
    else setSelectedIds([]);
  }, []);

  const addTableElement = useCallback((cols: number) => {
    const headers = Array.from({ length: cols }, (_, i) => `Coluna ${i + 1}`);
    const emptyRow = Array.from({ length: cols }, () => '');
    const newEl: CanvasElement = {
      id: uuidv4(),
      type: 'table',
      x: 40,
      y: 40 + Math.random() * 100,
      width: 515,
      height: 60,
      content: '',
      fontSize: 14, fontWeight: '400', fontFamily: 'Inter', color: '#0F172A', alignment: 'left',
      rows: [{ cells: headers }, { cells: emptyRow }],
      columnWidths: Array.from({ length: cols }, () => Math.round(100 / cols)),
      isVisible: true,
      fieldCategory: 'default',
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedIds([newEl.id]);
  }, [setElements]);

  const addElement = useCallback((type: ElementType) => {
    if (type === 'table') return; // handled by addTableElement
    const appSettings = getSettings();
    const newEl: CanvasElement = {
      id: uuidv4(),
      type,
      x: 40 + Math.random() * 100,
      y: 40 + Math.random() * 200,
      width: type === 'divider' ? 515 : 200,
      height: type === 'divider' ? 2 : type === 'notes' ? 80 : 30,
      content: type === 'text' ? 'Novo Texto' : type === 'notes' ? 'Observações...' : type === 'dynamic-field' ? '' : type === 'price-field' ? '' : type === 'total-calculation' ? 'Total:' : '',
      variable: type === 'dynamic-field' ? 'client_name' : type === 'price-field' ? 'price' : type === 'total-calculation' ? 'total' : undefined,
      fontSize: 14, fontWeight: '400', fontFamily: 'Inter', color: '#0F172A', alignment: 'left',
      imageUrl: type === 'logo' ? appSettings.logoUrl || undefined : undefined,
      objectFit: type === 'logo' || type === 'image' ? 'contain' : undefined,
      isVisible: true,
      fieldCategory: type === 'dynamic-field' ? 'input' : type === 'price-field' || type === 'total-calculation' ? 'calculated' : 'default',
    };
    if (type === 'logo') {
      newEl.width = 150;
      newEl.height = appSettings.logoAspectRatio ? Math.round(150 / appSettings.logoAspectRatio) : 80;
    }
    setElements((prev) => [...prev, newEl]);
    setSelectedIds([newEl.id]);
    if (isMobile) setShowMobileElements(false);
  }, [isMobile, setElements]);

  const addElementDirect = useCallback((el: CanvasElement) => {
    setElements((prev) => [...prev, el]);
    setSelectedIds([el.id]);
  }, [setElements]);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, [setElements]);

  const deleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((e) => e.id !== id));
    setSelectedIds((prev) => prev.filter((s) => s !== id));
  }, [setElements]);

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return;
    const el = elements.find(e => e.id === selectedId);
    if (!el) return;
    const newEl = { ...el, id: uuidv4(), x: el.x + 20, y: el.y + 20 };
    setElements(prev => [...prev, newEl]);
    setSelectedIds([newEl.id]);
  }, [selectedId, elements, setElements]);

  // Multi-select alignment operations
  const alignElements = useCallback((alignment: 'left' | 'center-x' | 'right' | 'top' | 'center-y' | 'bottom' | 'distribute-h' | 'distribute-v') => {
    if (selectedIds.length < 2) return;
    const currentEls = pages[currentPage] || [];
    const selected = currentEls.filter(el => selectedIds.includes(el.id));
    if (selected.length < 2) return;

    setElements(prev => {
      const sel = prev.filter(el => selectedIds.includes(el.id));
      if (sel.length < 2) return prev;

      let updates: Record<string, Partial<CanvasElement>> = {};

      switch (alignment) {
        case 'left': {
          const minX = Math.min(...sel.map(e => e.x));
          sel.forEach(e => { updates[e.id] = { x: minX }; });
          break;
        }
        case 'center-x': {
          const avgCenterX = sel.reduce((s, e) => s + e.x + e.width / 2, 0) / sel.length;
          sel.forEach(e => { updates[e.id] = { x: Math.round(avgCenterX - e.width / 2) }; });
          break;
        }
        case 'right': {
          const maxRight = Math.max(...sel.map(e => e.x + e.width));
          sel.forEach(e => { updates[e.id] = { x: maxRight - e.width }; });
          break;
        }
        case 'top': {
          const minY = Math.min(...sel.map(e => e.y));
          sel.forEach(e => { updates[e.id] = { y: minY }; });
          break;
        }
        case 'center-y': {
          const avgCenterY = sel.reduce((s, e) => s + e.y + e.height / 2, 0) / sel.length;
          sel.forEach(e => { updates[e.id] = { y: Math.round(avgCenterY - e.height / 2) }; });
          break;
        }
        case 'bottom': {
          const maxBottom = Math.max(...sel.map(e => e.y + e.height));
          sel.forEach(e => { updates[e.id] = { y: maxBottom - e.height }; });
          break;
        }
        case 'distribute-h': {
          const sorted = [...sel].sort((a, b) => a.x - b.x);
          const totalWidth = sorted.reduce((s, e) => s + e.width, 0);
          const minX = sorted[0].x;
          const maxRight = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width;
          const gap = (maxRight - minX - totalWidth) / (sorted.length - 1);
          let currentX = minX;
          sorted.forEach(e => {
            updates[e.id] = { x: Math.round(currentX) };
            currentX += e.width + gap;
          });
          break;
        }
        case 'distribute-v': {
          const sorted = [...sel].sort((a, b) => a.y - b.y);
          const totalHeight = sorted.reduce((s, e) => s + e.height, 0);
          const minY = sorted[0].y;
          const maxBottom = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
          const gap = (maxBottom - minY - totalHeight) / (sorted.length - 1);
          let currentY = minY;
          sorted.forEach(e => {
            updates[e.id] = { y: Math.round(currentY) };
            currentY += e.height + gap;
          });
          break;
        }
      }

      return prev.map(el => updates[el.id] ? { ...el, ...updates[el.id] } : el);
    });
  }, [selectedIds, pages, currentPage, setElements]);

  // Page management
  const addPage = useCallback(() => {
    setPages(prev => [...prev, []]);
    setCurrentPage(pages.length);
    setSelectedIds([]);
  }, [pages.length]);

  const deletePage = useCallback((index: number) => {
    if (pages.length <= 1) return;
    setPages(prev => prev.filter((_, i) => i !== index));
    if (currentPage >= pages.length - 1) {
      setCurrentPage(Math.max(0, pages.length - 2));
    } else if (currentPage > index) {
      setCurrentPage(currentPage - 1);
    }
    setSelectedIds([]);
  }, [pages.length, currentPage]);

  const duplicatePage = useCallback((index: number) => {
    const pageCopy = pages[index].map(el => ({ ...el, id: uuidv4() }));
    setPages(prev => {
      const newPages = [...prev];
      newPages.splice(index + 1, 0, pageCopy);
      return newPages;
    });
    setCurrentPage(index + 1);
    setSelectedIds([]);
  }, [pages]);

  const goToPage = useCallback((index: number) => {
    setCurrentPage(index);
    setSelectedIds([]);
  }, []);

  const handleSave = async () => {
    const shouldCreateNewId = isNew || !id || !isUuid(id);
    const finalId = shouldCreateNewId ? uuidv4() : id!;
    const savingToastId = toast.loading('Salvando template...');

    try {
      const optimizedLayout = await optimizeTemplatePagesForSave(pages);

      // Upload images to storage instead of saving base64 in the database
      let finalPages = optimizedLayout.pages;
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (userId) {
        const { uploadPageImagesToStorage } = await import('@/lib/imageStorage');
        finalPages = await uploadPageImagesToStorage(finalPages, userId, finalId);
      }

      const template: Template = {
        id: finalId,
        name: templateName,
        category: baseCategory,
        description: baseDescription,
        thumbnail: '',
        color: templateColor,
        elements: finalPages[0] || [],
        pages: finalPages,
        variables,
        canvasWidth: 595,
        canvasHeight: 842,
        defaultValues,
        inputFields,
        calculatedFields,
        settings: { ...settings, backgroundColor: canvasBgColor },
      };

      await saveTemplate(template);

      if (shouldCreateNewId) {
        navigate(`/editor/${finalId}`, { replace: true });
      }

      toast.success('Template salvo!');
      if (optimizedLayout.optimizedCount > 0) {
        toast.info(`${optimizedLayout.optimizedCount} imagem(ns) otimizadas.`);
      }

      return { id: finalId, name: templateName } as any;
    } catch (err) {
      console.error('Erro ao salvar template:', err);
      toast.error('Erro ao salvar template. Tente novamente.');
      throw err;
    } finally {
      toast.dismiss(savingToastId);
    }
  };

  const addVariable = () => {
    const v = newVar.trim().toLowerCase().replace(/\s+/g, '_');
    if (v && !variables.includes(v)) { setVariables((prev) => [...prev, v]); setNewVar(''); }
  };

  const toggleInputField = (v: string) => {
    setInputFields((prev) => prev.includes(v) ? prev.filter((f) => f !== v) : [...prev, v]);
  };

  const updateDefaultValue = (key: string, value: string) => {
    setDefaultValues((prev) => ({ ...prev, [key]: value }));
  };

  const updateCalculatedFormula = (field: string, formula: string) => {
    setCalculatedFields((prev) => ({ ...prev, [field]: formula }));
  };

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Type: LucideIcons.Type, Variable: LucideIcons.Variable, Image: LucideIcons.Image,
    Stamp: LucideIcons.Stamp, Minus: LucideIcons.Minus, Table: LucideIcons.Table,
    DollarSign: LucideIcons.DollarSign, Calculator: LucideIcons.Calculator, StickyNote: LucideIcons.StickyNote,
  };

  const elementLabels: Record<string, string> = {
    'text': 'Texto', 'dynamic-field': 'Campo', 'image': 'Imagem', 'logo': 'Logo',
    'divider': 'Divisor', 'table': 'Tabela', 'price-field': 'Preço', 'total-calculation': 'Total', 'notes': 'Notas',
  };

  const varLabels: Record<string, string> = {
    client_name: 'Nome do Cliente', event_name: 'Nome do Evento', location: 'Local',
    event_date: 'Data do Evento', data_de_hoje: 'Data de Hoje', service_name: 'Nome do Serviço',
    price: 'Preço', tax_rate: 'Taxa de Imposto', subtotal: 'Subtotal', tax: 'Imposto', total: 'Total',
  };

  // Desktop sidebar content
  const sidebarContent = (
    <Tabs defaultValue="elements" className="flex flex-1 flex-col">
      <TabsList className="mx-2 mt-2 grid w-auto grid-cols-3">
        <TabsTrigger value="elements" className="text-xs">Elementos</TabsTrigger>
        <TabsTrigger value="data" className="text-xs">Dados</TabsTrigger>
        <TabsTrigger value="settings" className="text-xs"><Settings2 className="h-3 w-3" /></TabsTrigger>
      </TabsList>

      <TabsContent value="elements" className="flex-1 overflow-y-auto">
        <div className="border-b border-border p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Adicionar Elementos</h3>
        </div>
        <div className="flex flex-col gap-1 p-2">
          {ELEMENT_PALETTE.map((item) => {
            const Icon = iconMap[item.icon];
            if (item.type === 'table') {
              return (
                <Popover key={item.type}>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent active:bg-accent/80 w-full">
                      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                      <span>{item.label}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="right" align="start" className="w-44 p-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Número de colunas</p>
                    <div className="flex flex-col gap-1">
                      {[2, 3, 4, 5].map((cols) => (
                        <button key={cols} onClick={() => addTableElement(cols)}
                          className="rounded-md px-3 py-2 text-sm text-left hover:bg-accent transition-colors">
                          {cols} colunas
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              );
            }
            return (
              <button key={item.type} onClick={() => addElement(item.type)}
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent active:bg-accent/80">
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Page thumbnails */}
        <div className="border-t border-border p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Páginas</h3>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={addPage}>
              <Plus className="h-3 w-3 mr-1" />
              Página
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {pages.map((pageEls, i) => (
              <div
                key={i}
                onClick={() => goToPage(i)}
                className={cn(
                  'group relative flex items-center gap-2 rounded-lg border px-2.5 py-2 cursor-pointer transition-colors',
                  i === currentPage ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent/50'
                )}
              >
                <div className="flex h-8 w-6 items-center justify-center rounded bg-card border border-border text-[10px] font-semibold text-muted-foreground shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">Página {i + 1}</p>
                  <p className="text-[10px] text-muted-foreground">{pageEls.length} elemento{pageEls.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity gap-0.5">
                  <button
                    className="p-1 text-muted-foreground hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); duplicatePage(i); }}
                    title="Duplicar página"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {pages.length > 1 && (
                    <button
                      className="p-1 text-destructive hover:text-destructive/80"
                      onClick={(e) => { e.stopPropagation(); deletePage(i); }}
                      title="Remover página"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Variáveis</h3>
          <div className="flex flex-col gap-1">
            {variables.map((v) => (
              <div key={v} className="flex items-center gap-1.5 rounded bg-accent px-2 py-1.5 text-xs text-foreground">
                <GripVertical className="h-3 w-3 text-muted-foreground" />
                <code className="font-mono">{`{{${v}}}`}</code>
                <span className="ml-auto text-[10px] text-muted-foreground">{varLabels[v] || ''}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-1">
            <Input value={newVar} onChange={(e) => setNewVar(e.target.value)} placeholder="nova_variavel" className="h-8 text-xs" onKeyDown={(e) => e.key === 'Enter' && addVariable()} />
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={addVariable}><Plus className="h-3 w-3" /></Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="data" className="flex-1 overflow-y-auto">
        <div className="border-b border-border p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Campos de Entrada</h3>
          <div className="flex flex-col gap-1.5">
            {variables.filter(v => v !== 'data_de_hoje').map((v) => (
              <label key={v} className="flex items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent/50 cursor-pointer">
                <input type="checkbox" checked={inputFields.includes(v)} onChange={() => toggleInputField(v)} className="h-3.5 w-3.5 rounded border-border" />
                <span className="text-foreground">{varLabels[v] || v.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="border-b border-border p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valores Padrão</h3>
          <div className="flex flex-col gap-2">
            {variables.filter((v) => !inputFields.includes(v) && !Object.keys(calculatedFields).includes(v) && v !== 'data_de_hoje').map((v) => (
              <div key={v}>
                <Label className="text-[10px] text-muted-foreground">{varLabels[v] || v.replace(/_/g, ' ')}</Label>
                {v === 'tax_rate' ? (
                  <div className="flex items-center gap-1">
                    <Input type="number" step="0.01" value={decimalToPercent(parseFloat(defaultValues[v] || '0'))}
                      onChange={(e) => { const d = percentToDecimal(parseFloat(e.target.value) || 0); updateDefaultValue(v, String(d)); }}
                      placeholder="Ex: 10" className="h-8 text-xs" />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                ) : (
                  <Input value={defaultValues[v] || ''} onChange={(e) => updateDefaultValue(v, e.target.value)}
                    placeholder={`Padrão para ${varLabels[v] || v}`} className="h-8 text-xs" />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Campos Calculados</h3>
          <div className="flex flex-col gap-2">
            {Object.entries(calculatedFields).map(([field, formula]) => (
              <div key={field}>
                <Label className="text-[10px] text-muted-foreground">{varLabels[field] || field}</Label>
                <Input value={formula} onChange={(e) => updateCalculatedFormula(field, e.target.value)} placeholder="ex: price * tax_rate" className="h-8 font-mono text-xs" />
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="settings" className="flex-1 overflow-y-auto p-3">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Configurações do Template</h3>
        <div className="flex flex-col gap-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Cor do Template</Label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setTemplateColor(c)}
                  className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: templateColor === c ? 'hsl(var(--foreground))' : 'transparent',
                  }}
                />
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Taxa de Imposto Padrão (%)</Label>
            <div className="flex items-center gap-1">
              <Input type="number" step="0.01" value={decimalToPercent(settings.taxRate)}
                onChange={(e) => { const p = parseFloat(e.target.value) || 0; const d = percentToDecimal(p); setSettings(prev => ({ ...prev, taxRate: d })); updateDefaultValue('tax_rate', String(d)); }}
                className="h-8 text-xs" />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <span className="text-xs font-medium text-foreground">Mostrar imposto no documento</span>
            <Switch checked={settings.showTax} onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showTax: checked }))} />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );

  // Mobile floating toolbar
  const mobileToolbar = (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      {selectedId && (
        <div className="flex items-center justify-center gap-1 border-b border-border px-2 py-1.5">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => selectedId && deleteElement(selectedId)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={duplicateSelected}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => selectedId && updateElement(selectedId, { alignment: 'left' })}>
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => selectedId && updateElement(selectedId, { alignment: 'center' })}>
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => selectedId && updateElement(selectedId, { alignment: 'right' })}>
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      {/* Page navigation + element palette */}
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs shrink-0" disabled={currentPage === 0} onClick={() => goToPage(currentPage - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs font-medium text-foreground shrink-0">
          {currentPage + 1}/{pages.length}
        </span>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs shrink-0" disabled={currentPage === pages.length - 1} onClick={() => goToPage(currentPage + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs shrink-0" onClick={addPage}>
          <Plus className="h-3.5 w-3.5 mr-0.5" />
          <FileText className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto px-2 py-2 scrollbar-hide">
        {ELEMENT_PALETTE.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <button key={item.type} onClick={() => addElement(item.type)}
              className="flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-foreground transition-colors active:bg-accent">
              {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
              <span className="text-[10px]">{elementLabels[item.type]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (loadingTemplate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-2 py-2 shrink-0">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)}
            className="h-9 w-28 sm:w-48 border-none bg-transparent text-sm font-semibold focus-visible:ring-1" />
        </div>
        <div className="flex items-center gap-1.5">
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
                <SheetHeader className="px-4 pt-4">
                  <SheetTitle className="text-sm">Configurações</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">{sidebarContent}</div>
              </SheetContent>
            </Sheet>
          )}
          <Button variant="outline" size="sm" className="h-10 md:h-9" onClick={() => { void handleSave(); }}>
            <Save className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Salvar</span>
          </Button>
          <Button
            size="sm"
            className="h-10 md:h-9"
            onClick={() => {
              const targetId = !isNew && id && isUuid(id) ? id : null;
              void handleSave();
              if (targetId) {
                navigate(`/generate/${targetId}`);
              }
              // For new templates, handleSave already navigates to /editor/:id
              // User can click Gerar again after save completes
            }}
          >
            <Play className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Gerar</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Desktop left sidebar */}
        {!isMobile && (
          <aside className="editor-sidebar hidden md:flex w-64 flex-col overflow-y-auto">
            {sidebarContent}
          </aside>
        )}

        {/* Canvas */}
        <main className={`flex flex-1 flex-col items-center overflow-auto bg-background ${isMobile ? 'pb-36' : ''}`}>
          {/* Canvas toolbar */}
          <div className="flex w-full items-center justify-center gap-2 border-b border-border bg-card px-3 py-1.5 shrink-0 flex-wrap">
            <Button
              variant={showGrid ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowGrid(!showGrid)}
              title={showGrid ? 'Ocultar grade' : 'Mostrar grade'}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>

            <div className="flex items-center gap-1.5">
              <ZoomOut className="h-3.5 w-3.5 text-muted-foreground" />
              <Slider
                value={[zoom]}
                onValueChange={([v]) => setZoom(v)}
                min={25}
                max={200}
                step={5}
                className="w-24 md:w-32"
              />
              <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground w-9 text-center">{zoom}%</span>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2">
                  <div className="h-4 w-4 rounded border border-border" style={{ backgroundColor: canvasBgColor }} />
                  <Paintbrush className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="center">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Cor de fundo</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {BG_PRESETS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCanvasBgColor(c)}
                      className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        borderColor: canvasBgColor === c ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                      }}
                    />
                  ))}
                </div>
                <Input
                  type="color"
                  value={canvasBgColor}
                  onChange={(e) => setCanvasBgColor(e.target.value)}
                  className="h-8 w-full cursor-pointer"
                />
              </PopoverContent>
            </Popover>

            {/* Multi-select alignment buttons */}
            {selectedIds.length > 1 && !isMobile && (
              <div className="flex items-center gap-0.5 ml-1 border-l border-border pl-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Alinhar à esquerda" onClick={() => alignElements('left')}>
                  <AlignStartVertical className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Centralizar horizontalmente" onClick={() => alignElements('center-x')}>
                  <AlignCenter className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Alinhar à direita" onClick={() => alignElements('right')}>
                  <AlignEndVertical className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Alinhar ao topo" onClick={() => alignElements('top')}>
                  <AlignStartHorizontal className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Centralizar verticalmente" onClick={() => alignElements('center-y')}>
                  <AlignVerticalJustifyCenter className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Alinhar embaixo" onClick={() => alignElements('bottom')}>
                  <AlignEndHorizontal className="h-3.5 w-3.5" />
                </Button>
                <div className="w-px h-5 bg-border mx-0.5" />
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Distribuir horizontalmente" onClick={() => alignElements('distribute-h')}>
                  <AlignHorizontalJustifyCenter className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Distribuir verticalmente" onClick={() => alignElements('distribute-v')}>
                  <AlignVerticalJustifyCenter className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* Desktop page nav */}
            {!isMobile && (
              <div className="flex items-center gap-1 ml-2 border-l border-border pl-2">
                <Button variant="ghost" size="sm" className="h-8 px-1.5" disabled={currentPage === 0} onClick={() => goToPage(currentPage - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs font-medium text-foreground px-1">
                  Pág {currentPage + 1}/{pages.length}
                </span>
                <Button variant="ghost" size="sm" className="h-8 px-1.5" disabled={currentPage === pages.length - 1} onClick={() => goToPage(currentPage + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={addPage}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-1 items-start justify-center overflow-auto p-4 md:p-8 w-full">
            <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.15s ease' }}>
              <CanvasRenderer
                ref={canvasRef}
                elements={elements}
                selectedId={selectedId}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onMultiSelect={setSelectedIds}
                onUpdate={updateElement}
                onAddElement={addElementDirect}
                showGrid={showGrid}
                backgroundColor={canvasBgColor}
              />
            </div>
          </div>
        </main>

        {/* Desktop right sidebar - properties */}
        {!isMobile && (
          <aside className="editor-sidebar hidden md:flex w-64 flex-col overflow-y-auto">
            <PropertiesPanel
              element={selectedElement}
              variables={variables}
              onUpdate={(updates) => selectedId && updateElement(selectedId, updates)}
              onDelete={() => selectedId && deleteElement(selectedId)}
            />
          </aside>
        )}

        {/* Mobile properties sheet */}
        {isMobile && selectedElement && (
          <Sheet open={!!selectedElement} onOpenChange={(open) => { if (!open) setSelectedIds([]); }}>
            <SheetContent side="bottom" className="max-h-[60vh] rounded-t-2xl">
              <SheetHeader>
                <SheetTitle className="text-sm">Propriedades</SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto">
                <PropertiesPanel
                  element={selectedElement}
                  variables={variables}
                  onUpdate={(updates) => selectedId && updateElement(selectedId, updates)}
                  onDelete={() => selectedId && deleteElement(selectedId)}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Mobile floating toolbar */}
      {isMobile && mobileToolbar}
    </div>
  );
};

export default Editor;
