import { CanvasElement } from '@/types/template';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Trash2, Plus, Upload, X, AlignLeft, AlignCenter, AlignRight, Underline, Italic, Strikethrough, List, ListOrdered, Minus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useRef } from 'react';
import { Separator } from '@/components/ui/separator';
import ImageEditingPanel from './ImageEditingPanel';
import { optimizeImageFile } from '@/lib/imageOptimization';

interface Props {
  element: CanvasElement | null;
  variables: string[];
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onDelete: () => void;
}

const PropertiesPanel = ({ element, variables, onUpdate, onDelete }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await optimizeImageFile(file, {
        maxDimension: element?.type === 'logo' ? 1400 : 1800,
        targetBytes: element?.type === 'logo' ? 900_000 : 800_000,
        preferredFormat: element?.type === 'logo' ? 'image/png' : 'image/jpeg',
      });

      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const newHeight = Math.round((element?.width || 150) / aspectRatio);
        onUpdate({
          imageUrl: url,
          objectFit: 'contain',
          height: newHeight,
        });
      };
      img.src = url;
    } catch (error) {
      console.error('Erro ao carregar imagem:', error);
    } finally {
      e.target.value = '';
    }
  };

  if (!element) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-center text-sm text-muted-foreground">
          Selecione um elemento para editar suas propriedades
        </p>
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    'text': 'Bloco de Texto',
    'dynamic-field': 'Campo Dinâmico',
    'image': 'Imagem',
    'logo': 'Logo',
    'divider': 'Divisor',
    'table': 'Tabela',
    'price-field': 'Campo de Preço',
    'total-calculation': 'Total',
    'notes': 'Observações',
  };

  const addRow = () => {
    if (!element.rows) return;
    const cols = element.rows[0]?.cells.length || 3;
    onUpdate({ rows: [...element.rows, { cells: Array(cols).fill('') }] });
  };

  const updateCell = (ri: number, ci: number, value: string) => {
    if (!element.rows) return;
    const newRows = element.rows.map((r, i) =>
      i === ri ? { cells: r.cells.map((c, j) => (j === ci ? value : c)) } : r
    );
    onUpdate({ rows: newRows });
  };

  const removeRow = (ri: number) => {
    if (!element.rows || element.rows.length <= 1) return;
    onUpdate({ rows: element.rows.filter((_, i) => i !== ri) });
  };

  const isLogoOrImage = element.type === 'logo' || element.type === 'image';

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Propriedades
        </h3>
        <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="rounded-md bg-accent/50 px-2 py-1">
        <span className="text-xs font-medium text-foreground">{typeLabels[element.type] || element.type}</span>
      </div>

      {/* Posição */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">X</Label>
          <Input type="number" value={element.x} onChange={(e) => onUpdate({ x: +e.target.value })} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Y</Label>
          <Input type="number" value={element.y} onChange={(e) => onUpdate({ y: +e.target.value })} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Largura</Label>
          <Input
            type="number"
            value={element.width}
            onChange={(e) => {
              const newW = +e.target.value;
              if (isLogoOrImage && element.height > 0) {
                const ar = element.width / element.height;
                onUpdate({ width: newW, height: Math.round(newW / ar) });
              } else {
                onUpdate({ width: newW });
              }
            }}
            className="h-7 text-xs"
          />
        </div>
        {!isLogoOrImage && (
          <div>
            <Label className="text-xs text-muted-foreground">Altura</Label>
            <Input type="number" value={element.height} onChange={(e) => onUpdate({ height: +e.target.value })} className="h-7 text-xs" />
          </div>
        )}
      </div>

      {/* Service-specific toggles */}
      {element.type === 'service' && (
        <div className="space-y-3">
          <Separator />
          <div>
            <Label className="text-xs text-muted-foreground">Opacidade do fundo ({element.bgOpacity ?? 100}%)</Label>
            <Slider
              min={0}
              max={100}
              step={5}
              value={[element.bgOpacity ?? 100]}
              onValueChange={([v]) => onUpdate({ bgOpacity: v })}
              className="mt-1"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Mostrar preço</Label>
            <Switch
              checked={element.showPrice !== false}
              onCheckedChange={(checked) => onUpdate({ showPrice: checked })}
            />
          </div>
        </div>
      )}

      {isLogoOrImage && (
        <div>
          <Label className="text-xs text-muted-foreground">
            {element.type === 'logo' ? 'Logo' : 'Imagem'}
          </Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          {element.imageUrl ? (
            <div className="mt-1 space-y-2">
              <div className="relative overflow-hidden rounded border border-border">
                <img src={element.imageUrl} alt="Preview" className="w-full object-contain bg-accent/30" style={{ height: 'auto' }} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-6 w-6 rounded-full bg-card/80 p-0"
                  onClick={() => onUpdate({ imageUrl: undefined })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="mt-1 w-full text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-1.5 h-3 w-3" />
              Enviar {element.type === 'logo' ? 'Logo' : 'Imagem'}
            </Button>
          )}

          {/* Full Image Editing Panel */}
          {element.imageUrl && (
            <>
              <Separator className="my-3" />
              <ImageEditingPanel element={element} onUpdate={onUpdate} />
            </>
          )}
        </div>
      )}

      {/* Conteúdo - only for non-text types (text/notes use inline editing) */}
      {element.type !== 'divider' && !isLogoOrImage && element.type !== 'table' && element.type !== 'text' && element.type !== 'notes' && (
        <div>
          <Label className="text-xs text-muted-foreground">Conteúdo</Label>
          <Input value={element.content} onChange={(e) => onUpdate({ content: e.target.value })} className="h-7 text-xs" />
        </div>
      )}

      {/* Variável */}
      {(element.type === 'dynamic-field' || element.type === 'price-field' || element.type === 'total-calculation') && (
        <div>
          <Label className="text-xs text-muted-foreground">Variável</Label>
          <Select value={element.variable || ''} onValueChange={(v) => onUpdate({ variable: v })}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {variables.map((v) => (
                <SelectItem key={v} value={v} className="text-xs">
                  {`{{${v}}}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Cor do Divisor */}
      {element.type === 'divider' && (
        <div>
          <Label className="text-xs text-muted-foreground">Cor do Divisor</Label>
          <div className="flex gap-2">
            <input type="color" value={element.color || '#E2E8F0'} onChange={(e) => onUpdate({ color: e.target.value })} className="h-7 w-7 cursor-pointer rounded border border-border" />
            <Input value={element.color || '#E2E8F0'} onChange={(e) => onUpdate({ color: e.target.value })} className="h-7 flex-1 text-xs" />
          </div>
        </div>
      )}

      {/* Cores da Tabela */}
      {element.type === 'table' && (
        <>
          <div>
            <Label className="text-xs text-muted-foreground">Cor do Texto</Label>
            <div className="flex gap-2">
              <input type="color" value={element.color || '#0F172A'} onChange={(e) => onUpdate({ color: e.target.value })} className="h-7 w-7 cursor-pointer rounded border border-border" />
              <Input value={element.color || '#0F172A'} onChange={(e) => onUpdate({ color: e.target.value })} className="h-7 flex-1 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Cor das Bordas</Label>
            <div className="flex gap-2">
              <input type="color" value={element.tableBorderColor || '#C8CCD4'} onChange={(e) => onUpdate({ tableBorderColor: e.target.value })} className="h-7 w-7 cursor-pointer rounded border border-border" />
              <Input value={element.tableBorderColor || '#C8CCD4'} onChange={(e) => onUpdate({ tableBorderColor: e.target.value })} className="h-7 flex-1 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Fundo do Cabeçalho</Label>
            <div className="flex gap-2">
              <input type="color" value={element.tableHeaderBg || '#DCDFE4'} onChange={(e) => onUpdate({ tableHeaderBg: e.target.value })} className="h-7 w-7 cursor-pointer rounded border border-border" />
              <Input value={element.tableHeaderBg || '#DCDFE4'} onChange={(e) => onUpdate({ tableHeaderBg: e.target.value })} className="h-7 flex-1 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Fundo das Linhas</Label>
            <div className="flex gap-2">
              <input type="color" value={element.tableRowBg || '#FFFFFF'} onChange={(e) => onUpdate({ tableRowBg: e.target.value })} className="h-7 w-7 cursor-pointer rounded border border-border" />
              <Input value={element.tableRowBg || '#FFFFFF'} onChange={(e) => onUpdate({ tableRowBg: e.target.value })} className="h-7 flex-1 text-xs" />
            </div>
          </div>
        </>
      )}

      {/* Tipografia */}
      {element.type !== 'divider' && !isLogoOrImage && element.type !== 'table' && (
        <>
          <div>
            <Label className="text-xs text-muted-foreground">Cor</Label>
            <div className="flex gap-2">
              <input type="color" value={element.color || '#0F172A'} onChange={(e) => onUpdate({ color: e.target.value })} className="h-7 w-7 cursor-pointer rounded border border-border" />
              <Input value={element.color || '#0F172A'} onChange={(e) => onUpdate({ color: e.target.value })} className="h-7 flex-1 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Tamanho da Fonte</Label>
            <Input type="number" value={element.fontSize || 14} onChange={(e) => onUpdate({ fontSize: +e.target.value })} className="h-7 text-xs" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Peso da Fonte</Label>
            <Select value={element.fontWeight || '400'} onValueChange={(v) => onUpdate({ fontWeight: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="300">Leve</SelectItem>
                <SelectItem value="400">Normal</SelectItem>
                <SelectItem value="500">Médio</SelectItem>
                <SelectItem value="600">Semi-negrito</SelectItem>
                <SelectItem value="700">Negrito</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Família da Fonte</Label>
            <Select value={element.fontFamily || 'Inter'} onValueChange={(v) => onUpdate({ fontFamily: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-64">
                {[
                  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
                  'Raleway', 'Nunito', 'PT Sans', 'Source Sans 3', 'Work Sans',
                  'DM Sans', 'Space Grotesk', 'Archivo', 'Syne',
                  'Oswald', 'Bebas Neue',
                  'Merriweather', 'Playfair Display', 'Libre Baskerville',
                  'Crimson Text', 'Bitter', 'Cormorant Garamond',
                ].map((font) => (
                  <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Formatação</Label>
            <div className="flex items-center gap-1 flex-wrap">
              {([
                { value: 'left', icon: AlignLeft },
                { value: 'center', icon: AlignCenter },
                { value: 'right', icon: AlignRight },
              ] as const).map(({ value, icon: Icon }) => (
                <Button
                  key={value}
                  variant={(element.alignment || 'left') === value ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => onUpdate({ alignment: value })}
                >
                  <Icon className="h-3.5 w-3.5" />
                </Button>
              ))}
              <Separator orientation="vertical" className="mx-1 h-5" />
              <Button
                variant={element.fontStyle === 'italic' ? 'default' : 'outline'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onUpdate({ fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' })}
              >
                <Italic className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={element.textDecoration === 'underline' ? 'default' : 'outline'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onUpdate({ textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline' })}
              >
                <Underline className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={element.textDecoration === 'line-through' ? 'default' : 'outline'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onUpdate({ textDecoration: element.textDecoration === 'line-through' ? 'none' : 'line-through' })}
              >
                <Strikethrough className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Lista</Label>
            <div className="flex items-center gap-1">
              <Button
                variant={!element.listType || element.listType === 'none' ? 'default' : 'outline'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onUpdate({ listType: 'none' })}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={element.listType === 'bullet' ? 'default' : 'outline'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onUpdate({ listType: 'bullet' })}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={element.listType === 'number' ? 'default' : 'outline'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onUpdate({ listType: 'number' })}
              >
                <ListOrdered className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Espaçamento ({element.lineHeight || 1.4})</Label>
            <Slider
              value={[element.lineHeight || 1.4]}
              min={1}
              max={2.5}
              step={0.1}
              onValueChange={([v]) => onUpdate({ lineHeight: Math.round(v * 10) / 10 })}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Espaço entre letras ({element.letterSpacing || 0})</Label>
            <Slider
              value={[element.letterSpacing || 0]}
              min={-0.05}
              max={0.3}
              step={0.01}
              onValueChange={([v]) => onUpdate({ letterSpacing: Math.round(v * 100) / 100 })}
            />
          </div>
        </>
      )}

      {/* Largura das Colunas */}
      {element.type === 'table' && element.rows && element.rows[0] && (
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Largura das Colunas</Label>
          <div className="flex flex-col gap-2">
            {element.rows[0].cells.map((header, ci) => {
              const widths = element.columnWidths || element.rows![0].cells.map(() => Math.round(100 / element.rows![0].cells.length));
              return (
                <div key={ci} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-12 truncate">{header || `Col ${ci + 1}`}</span>
                  <Slider
                    value={[widths[ci] || Math.round(100 / widths.length)]}
                    min={10}
                    max={80}
                    step={1}
                    className="flex-1"
                    onValueChange={([val]) => {
                      const newWidths = [...widths];
                      const diff = val - newWidths[ci];
                      newWidths[ci] = val;
                      // Distribute the difference to other columns proportionally
                      const others = newWidths.filter((_, i) => i !== ci);
                      const othersSum = others.reduce((a, b) => a + b, 0);
                      if (othersSum > 0) {
                        for (let i = 0; i < newWidths.length; i++) {
                          if (i !== ci) {
                            newWidths[i] = Math.max(10, Math.round(newWidths[i] - (diff * newWidths[i] / othersSum)));
                          }
                        }
                      }
                      onUpdate({ columnWidths: newWidths });
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground w-8 text-right">{widths[ci]}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Número de Colunas */}
      {element.type === 'table' && element.rows && (
        <div>
          <Label className="text-xs text-muted-foreground">Número de Colunas</Label>
          <Select
            value={String(element.rows[0]?.cells.length || 3)}
            onValueChange={(v) => {
              const newCols = +v;
              const oldCols = element.rows![0]?.cells.length || 3;
              if (newCols === oldCols) return;
              const newRows = element.rows!.map((row) => {
                if (newCols > oldCols) {
                  return { cells: [...row.cells, ...Array(newCols - oldCols).fill('')] };
                } else {
                  return { cells: row.cells.slice(0, newCols) };
                }
              });
              const newWidths = Array.from({ length: newCols }, () => Math.round(100 / newCols));
              onUpdate({ rows: newRows, columnWidths: newWidths });
            }}
          >
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} colunas</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Editor de Tabela */}
      {element.type === 'table' && element.rows && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Células da Tabela</Label>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={addRow}>
              <Plus className="mr-1 h-3 w-3" /> Linha
            </Button>
          </div>
          <div className="flex flex-col gap-1.5">
            {element.rows.map((row, ri) => (
              <div key={ri} className="flex items-center gap-1">
                <div className="flex flex-1 gap-1">
                  {row.cells.map((cell, ci) => (
                    <Input
                      key={ci}
                      value={cell}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      className="h-6 text-[10px]"
                      placeholder={ri === 0 ? 'Cabeçalho' : 'Célula'}
                    />
                  ))}
                </div>
                {ri > 0 && (
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeRow(ri)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesPanel;
