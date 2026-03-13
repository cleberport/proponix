import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { getTemplateById, generatePdfFileName, addDocumentToHistory, getDocumentById } from '@/lib/templateStorage';
import { resolveAllValues, formatCurrency, formatEventDate } from '@/lib/calculations';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Download, FileText, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import CanvasRenderer from '@/components/editor/CanvasRenderer';
import { generateVectorPdf } from '@/lib/pdfGenerator';

const Generate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const template = getTemplateById(id!);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Check if we're editing a previous document
  const editingDoc = (location.state as { documentId?: string; values?: Record<string, string> }) || {};

  const inputFields = template?.inputFields || [];

  const [userInputs, setUserInputs] = useState<Record<string, string>>(() => {
    // Pre-fill from history if editing
    if (editingDoc.values) {
      return { ...editingDoc.values };
    }
    if (!template) return {};
    const init: Record<string, string> = {};
    inputFields.forEach((v) => (init[v] = ''));
    return init;
  });

  const [showTax, setShowTax] = useState(template?.settings?.showTax ?? true);
  const [generating, setGenerating] = useState(false);

  const resolvedValues = useMemo(() => {
    if (!template) return {};
    const inputs = { ...userInputs };
    if (inputs.event_date) {
      inputs.event_date = formatEventDate(inputs.event_date);
    }
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

  const visibleElements = useMemo(() => {
    if (!template) return [];
    if (showTax) return template.elements;
    return template.elements.filter((el) => {
      if (el.variable === 'tax' && (el.type === 'price-field' || el.type === 'total-calculation')) {
        return false;
      }
      return el.isVisible !== false;
    });
  }, [template, showTax]);

  const handleChange = (key: string, val: string) => {
    setUserInputs((prev) => ({ ...prev, [key]: val }));
  };

  const handleGeneratePDF = useCallback(async () => {
    if (!template) return;
    setGenerating(true);
    try {
      const fileName = generatePdfFileName();

      // Use vector PDF generation
      await generateVectorPdf(visibleElements, displayValues, fileName);

      // Save to history
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
  }, [template, userInputs, visibleElements, displayValues]);

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
      client_name: 'Nome do Cliente',
      event_name: 'Nome do Evento',
      location: 'Local',
      event_date: 'Data do Evento',
      data_de_hoje: 'Data de Hoje',
      service_name: 'Nome do Serviço',
      price: 'Preço',
      tax_rate: 'Taxa de Imposto',
      subtotal: 'Subtotal',
      tax: 'Imposto',
      total: 'Total',
      notes_text: 'Observações',
    };
    return labels[v] || v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getPlaceholder = (v: string) => {
    const placeholders: Record<string, string> = {
      client_name: 'Ex: João Silva',
      event_name: 'Ex: Casamento',
      location: 'Ex: São Paulo, SP',
      event_date: 'Ex: 23/04/2026 ou 23/04/2026 a 25/04/2026',
      price: 'Ex: 5000',
    };
    return placeholders[v] || `Preencha ${formatLabel(v).toLowerCase()}`;
  };

  const calculatedFields = template.calculatedFields || {};

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card px-3 py-2 md:px-4">
        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 md:h-8 md:w-auto md:px-3" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="hidden h-4 w-4 text-primary md:block" />
            <span className="text-sm font-semibold text-foreground truncate max-w-[150px] md:max-w-none">{template.name}</span>
          </div>
        </div>
        <Button size="sm" className="h-9 md:h-8" onClick={handleGeneratePDF} disabled={generating}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {generating ? 'Gerando...' : 'Baixar PDF'}
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <aside className="editor-sidebar w-full md:w-80 overflow-y-auto p-4 md:p-5 max-h-[50vh] md:max-h-none">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Preencha os Dados
          </h3>
          <div className="flex flex-col gap-4">
            {inputFields.map((v) => (
              <div key={v}>
                <Label className="mb-1 text-xs font-medium text-foreground">{formatLabel(v)}</Label>
                <Input
                  value={userInputs[v] || ''}
                  onChange={(e) => handleChange(v, e.target.value)}
                  placeholder={getPlaceholder(v)}
                  className="h-10 md:h-9 text-sm"
                />
                {v === 'event_date' && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Aceita data única ou intervalo (ex: 23/05/2026 a 25/05/2026)
                  </p>
                )}
              </div>
            ))}
          </div>

          {Object.keys(calculatedFields).length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Totais Calculados
              </h3>
              <div className="flex flex-col gap-2">
                {Object.entries(calculatedFields)
                  .filter(([field]) => showTax || field !== 'tax')
                  .map(([field]) => (
                  <div key={field} className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 md:py-2">
                    <span className="text-xs font-medium text-foreground">{formatLabel(field)}</span>
                    <span className="text-sm font-semibold text-primary">
                      {displayValues[field] || 'R$ 0,00'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between rounded-md border border-border px-3 py-3 md:py-2.5">
            <div className="flex items-center gap-2">
              {showTax ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              <span className="text-xs font-medium text-foreground">Mostrar imposto no documento</span>
            </div>
            <Switch checked={showTax} onCheckedChange={setShowTax} />
          </div>
          {!showTax && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              O imposto está oculto mas ainda é incluído no total.
            </p>
          )}
        </aside>

        <main className="flex flex-1 items-center justify-center overflow-auto bg-background p-4 md:p-8">
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
      </div>
    </div>
  );
};

export default Generate;
