import { useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getTemplateById, saveTemplate, getSettings } from '@/lib/templateStorage';
import { decimalToPercent, percentToDecimal } from '@/lib/calculations';
import { CanvasElement, ElementType, ELEMENT_PALETTE, DEFAULT_VARIABLES, Template, TemplateSettings, DEFAULT_TEMPLATE_VALUES, DEFAULT_CALCULATED_FIELDS, TEMPLATE_COLORS } from '@/types/template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Play, Plus, GripVertical, Settings2, Trash2, Copy, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { toast } from 'sonner';
import CanvasRenderer from '@/components/editor/CanvasRenderer';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const GRID = 10;

const Editor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLDivElement>(null);

  const isNew = id === 'new';
  const base = isNew ? null : getTemplateById(id!);

  const [templateName, setTemplateName] = useState(base?.name || 'Template sem título');
  const [elements, setElements] = useState<CanvasElement[]>(base?.elements || []);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newVar, setNewVar] = useState('');
  const [variables, setVariables] = useState<string[]>(base?.variables || [...DEFAULT_VARIABLES]);
  const [defaultValues, setDefaultValues] = useState<Record<string, string>>(base?.defaultValues || { ...DEFAULT_TEMPLATE_VALUES });
  const [inputFields, setInputFields] = useState<string[]>(base?.inputFields || ['client_name', 'event_name', 'location', 'event_date']);
  const [calculatedFields, setCalculatedFields] = useState<Record<string, string>>(base?.calculatedFields || { ...DEFAULT_CALCULATED_FIELDS });
  const [settings, setSettings] = useState<TemplateSettings>(base?.settings || { taxRate: 0.10, showTax: true });
  const [templateColor, setTemplateColor] = useState(base?.color || TEMPLATE_COLORS[Math.floor(Math.random() * TEMPLATE_COLORS.length)]);
  const [mobileTab, setMobileTab] = useState<'canvas' | 'properties'>('canvas');
  const [showMobileElements, setShowMobileElements] = useState(false);

  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const selectedElement = selectedId ? elements.find((e) => e.id === selectedId) || null : null;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIds.length === 0) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      const step = e.shiftKey ? 50 : GRID;

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          setElements((prev) => prev.filter((el) => !selectedIds.includes(el.id)));
          setSelectedIds([]);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setElements((prev) => prev.map((el) => selectedIds.includes(el.id) ? { ...el, y: Math.max(0, el.y - step) } : el));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setElements((prev) => prev.map((el) => selectedIds.includes(el.id) ? { ...el, y: el.y + step } : el));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setElements((prev) => prev.map((el) => selectedIds.includes(el.id) ? { ...el, x: Math.max(0, el.x - step) } : el));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setElements((prev) => prev.map((el) => selectedIds.includes(el.id) ? { ...el, x: el.x + step } : el));
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds]);

  const handleSelect = useCallback((id: string | null) => {
    if (id) setSelectedIds([id]);
    else setSelectedIds([]);
  }, []);

  const addElement = useCallback((type: ElementType) => {
    const appSettings = getSettings();
    const newEl: CanvasElement = {
      id: uuidv4(),
      type,
      x: 40 + Math.random() * 100,
      y: 40 + Math.random() * 200,
      width: type === 'divider' ? 515 : type === 'table' ? 515 : 200,
      height: type === 'divider' ? 2 : type === 'table' ? 150 : type === 'notes' ? 80 : 30,
      content: type === 'text' ? 'Novo Texto' : type === 'notes' ? 'Observações...' : type === 'dynamic-field' ? '' : type === 'price-field' ? '' : type === 'total-calculation' ? 'Total:' : '',
      variable: type === 'dynamic-field' ? 'client_name' : type === 'price-field' ? 'price' : type === 'total-calculation' ? 'total' : undefined,
      fontSize: 14, fontWeight: '400', fontFamily: 'Inter', color: '#0F172A', alignment: 'left',
      rows: type === 'table' ? [{ cells: ['Coluna 1', 'Coluna 2', 'Coluna 3'] }, { cells: ['', '', ''] }] : undefined,
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
  }, [isMobile]);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((e) => e.id !== id));
    setSelectedIds((prev) => prev.filter((s) => s !== id));
  }, []);

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return;
    const el = elements.find(e => e.id === selectedId);
    if (!el) return;
    const newEl = { ...el, id: uuidv4(), x: el.x + 20, y: el.y + 20 };
    setElements(prev => [...prev, newEl]);
    setSelectedIds([newEl.id]);
  }, [selectedId, elements]);

  const handleSave = () => {
    const template: Template = {
      id: isNew ? uuidv4() : id!,
      name: templateName, category: base?.category || 'Custom', description: base?.description || 'Template personalizado',
      thumbnail: '', color: templateColor, elements, variables, canvasWidth: 595, canvasHeight: 842,
      defaultValues, inputFields, calculatedFields, settings,
    };
    const saved = saveTemplate(template);
    toast.success('Template salvo!');
    if (isNew) navigate(`/editor/${saved.id}`, { replace: true });
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
            return (
              <button key={item.type} onClick={() => addElement(item.type)}
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent active:bg-accent/80">
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                <span>{item.label}</span>
              </button>
            );
          })}
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
      {/* Element action bar when selected */}
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
      {/* Element palette */}
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
          <Button variant="outline" size="sm" className="h-10 md:h-9" onClick={handleSave}>
            <Save className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Salvar</span>
          </Button>
          <Button size="sm" className="h-10 md:h-9" onClick={() => { handleSave(); navigate(`/generate/${isNew ? 'new' : id}`); }}>
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
        <main className={`flex flex-1 items-start justify-center overflow-auto bg-background p-4 md:p-8 ${isMobile ? 'pb-28' : ''}`}>
          <CanvasRenderer
            ref={canvasRef}
            elements={elements}
            selectedId={selectedId}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onMultiSelect={setSelectedIds}
            onUpdate={updateElement}
          />
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
