import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useCallback, useMemo } from 'react';
import { getTemplateById } from '@/lib/templateStorage';
import { resolveAllValues, formatCurrency } from '@/lib/calculations';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Download, FileText, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import CanvasRenderer from '@/components/editor/CanvasRenderer';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Generate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const template = getTemplateById(id!);
  const canvasRef = useRef<HTMLDivElement>(null);

  const inputFields = template?.inputFields || template?.variables || [];

  const [userInputs, setUserInputs] = useState<Record<string, string>>(() => {
    if (!template) return {};
    const init: Record<string, string> = {};
    inputFields.forEach((v) => (init[v] = ''));
    return init;
  });

  const [showTax, setShowTax] = useState(template?.settings?.showTax ?? true);
  const [generating, setGenerating] = useState(false);

  // Resolve all values: defaults + user inputs + calculations
  const resolvedValues = useMemo(() => {
    if (!template) return {};
    const allValues = resolveAllValues(template, userInputs);
    return allValues;
  }, [template, userInputs]);

  // For display: format currency fields
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

  // Filter elements based on tax visibility
  const visibleElements = useMemo(() => {
    if (!template) return [];
    if (showTax) return template.elements;
    return template.elements.filter((el) => {
      // Hide tax line if showTax is false
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
    if (!canvasRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`${template?.name || 'document'}.pdf`);
      toast.success('PDF generated successfully!');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  }, [template?.name]);

  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Template not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const formatLabel = (v: string) =>
    v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const defaultValues = template.defaultValues || {};
  const calculatedFields = template.calculatedFields || {};

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{template.name}</span>
          </div>
        </div>
        <Button size="sm" onClick={handleGeneratePDF} disabled={generating}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {generating ? 'Generating...' : 'Download PDF'}
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Left - Form */}
        <aside className="editor-sidebar w-full md:w-80 overflow-y-auto p-4 md:p-5 max-h-[50vh] md:max-h-none">
          {/* Input Fields */}
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Fill in Details
          </h3>
          <div className="flex flex-col gap-4">
            {inputFields.map((v) => (
              <div key={v}>
                <Label className="mb-1 text-xs font-medium text-foreground">{formatLabel(v)}</Label>
                <Input
                  value={userInputs[v] || ''}
                  onChange={(e) => handleChange(v, e.target.value)}
                  placeholder={`Enter ${formatLabel(v).toLowerCase()}`}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>

          {/* Template Defaults (read-only summary) */}
          {Object.keys(defaultValues).length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Template Defaults
              </h3>
              <div className="flex flex-col gap-2">
                {Object.entries(defaultValues).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-md bg-accent/50 px-3 py-1.5">
                    <span className="text-xs text-muted-foreground">{formatLabel(k)}</span>
                    <span className="text-xs font-medium text-foreground">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calculated Summary */}
          {Object.keys(calculatedFields).length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Calculated Totals
              </h3>
              <div className="flex flex-col gap-2">
                {Object.entries(calculatedFields).map(([field]) => (
                  <div key={field} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <span className="text-xs font-medium text-foreground">{formatLabel(field)}</span>
                    <span className="text-sm font-semibold text-primary">
                      {displayValues[field] || '$0.00'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tax Visibility Toggle */}
          <div className="mt-6 flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <div className="flex items-center gap-2">
              {showTax ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              <span className="text-xs font-medium text-foreground">Show tax on document</span>
            </div>
            <Switch checked={showTax} onCheckedChange={setShowTax} />
          </div>
          {!showTax && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              Tax is hidden but still included in the total price.
            </p>
          )}
        </aside>

        {/* Right - Preview */}
        <main className="flex flex-1 items-center justify-center overflow-auto bg-background p-8">
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
