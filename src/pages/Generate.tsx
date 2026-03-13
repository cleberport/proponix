import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useCallback } from 'react';
import { getTemplateById } from '@/lib/templateStorage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import CanvasRenderer from '@/components/editor/CanvasRenderer';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Generate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const template = getTemplateById(id!);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [values, setValues] = useState<Record<string, string>>(() => {
    if (!template) return {};
    const init: Record<string, string> = {};
    template.variables.forEach((v) => (init[v] = ''));
    return init;
  });

  const [generating, setGenerating] = useState(false);

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
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

      <div className="flex flex-1 overflow-hidden">
        {/* Left - Form */}
        <aside className="editor-sidebar w-80 overflow-y-auto p-5">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Fill in Details
          </h3>
          <div className="flex flex-col gap-4">
            {template.variables.map((v) => (
              <div key={v}>
                <Label className="mb-1 text-xs font-medium text-foreground">{formatLabel(v)}</Label>
                <Input
                  value={values[v] || ''}
                  onChange={(e) => handleChange(v, e.target.value)}
                  placeholder={`Enter ${formatLabel(v).toLowerCase()}`}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
        </aside>

        {/* Right - Preview */}
        <main className="flex flex-1 items-center justify-center overflow-auto bg-background p-8">
          <CanvasRenderer
            ref={canvasRef}
            elements={template.elements}
            selectedId={null}
            onSelect={() => {}}
            onUpdate={() => {}}
            readOnly
            variableValues={values}
          />
        </main>
      </div>
    </div>
  );
};

export default Generate;
