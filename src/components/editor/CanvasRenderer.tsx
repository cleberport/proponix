import { forwardRef, useCallback, useState, useRef } from 'react';
import { CanvasElement } from '@/types/template';

interface Props {
  elements: CanvasElement[];
  selectedId: string | null;
  selectedIds?: string[];
  onSelect: (id: string | null) => void;
  onMultiSelect?: (ids: string[]) => void;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  readOnly?: boolean;
  variableValues?: Record<string, string>;
}

const CANVAS_W = 595;
const CANVAS_H = 842;
const GRID = 10;

const snap = (v: number) => Math.round(v / GRID) * GRID;

const CanvasRenderer = forwardRef<HTMLDivElement, Props>(
  ({ elements, selectedId, selectedIds = [], onSelect, onMultiSelect, onUpdate, readOnly, variableValues }, ref) => {
    const [dragging, setDragging] = useState<string | null>(null);
    const [resizing, setResizing] = useState<string | null>(null);
    const [boxSelect, setBoxSelect] = useState<{ startX: number; startY: number; x: number; y: number } | null>(null);
    const startPos = useRef({ x: 0, y: 0, elX: 0, elY: 0, elW: 0, elH: 0 });
    const canvasElRef = useRef<HTMLDivElement>(null);

    const isSelected = (id: string) => selectedIds.includes(id) || selectedId === id;

    const handlePointerDown = useCallback(
      (e: React.PointerEvent, el: CanvasElement, mode: 'drag' | 'resize') => {
        if (readOnly) return;
        e.stopPropagation();
        e.preventDefault();
        onSelect(el.id);
        startPos.current = { x: e.clientX, y: e.clientY, elX: el.x, elY: el.y, elW: el.width, elH: el.height };
        if (mode === 'drag') setDragging(el.id);
        else setResizing(el.id);

        const isLogo = el.type === 'logo';
        const aspectRatio = isLogo && el.height > 0 ? el.width / el.height : 0;

        // For multi-drag, store all selected element positions
        const multiDragStart = selectedIds.includes(el.id) && selectedIds.length > 1 && mode === 'drag'
          ? elements.filter(e => selectedIds.includes(e.id)).map(e => ({ id: e.id, x: e.x, y: e.y }))
          : null;

        const handleMove = (ev: PointerEvent) => {
          const dx = ev.clientX - startPos.current.x;
          const dy = ev.clientY - startPos.current.y;
          if (mode === 'drag') {
            if (multiDragStart) {
              multiDragStart.forEach(item => {
                onUpdate(item.id, {
                  x: snap(Math.max(0, item.x + dx)),
                  y: snap(Math.max(0, item.y + dy)),
                });
              });
            } else {
              onUpdate(el.id, {
                x: snap(Math.max(0, Math.min(CANVAS_W - el.width, startPos.current.elX + dx))),
                y: snap(Math.max(0, Math.min(CANVAS_H - el.height, startPos.current.elY + dy))),
              });
            }
          } else {
            if (isLogo && aspectRatio > 0) {
              const newW = snap(Math.max(40, startPos.current.elW + dx));
              const newH = Math.round(newW / aspectRatio);
              onUpdate(el.id, { width: newW, height: newH });
            } else {
              onUpdate(el.id, {
                width: snap(Math.max(40, startPos.current.elW + dx)),
                height: snap(Math.max(10, startPos.current.elH + dy)),
              });
            }
          }
        };

        const handleUp = () => {
          setDragging(null);
          setResizing(null);
          document.removeEventListener('pointermove', handleMove);
          document.removeEventListener('pointerup', handleUp);
        };

        document.addEventListener('pointermove', handleMove);
        document.addEventListener('pointerup', handleUp);
      },
      [onSelect, onUpdate, readOnly, selectedIds, elements]
    );

    // Box selection
    const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
      if (readOnly) return;
      onSelect(null);
      
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setBoxSelect({ startX: x, startY: y, x, y });

      const handleMove = (ev: PointerEvent) => {
        const mx = ev.clientX - rect.left;
        const my = ev.clientY - rect.top;
        setBoxSelect(prev => prev ? { ...prev, x: mx, y: my } : null);
      };

      const handleUp = (ev: PointerEvent) => {
        const mx = ev.clientX - rect.left;
        const my = ev.clientY - rect.top;
        setBoxSelect(null);
        
        // Find elements within the box
        const x1 = Math.min(x, mx);
        const y1 = Math.min(y, my);
        const x2 = Math.max(x, mx);
        const y2 = Math.max(y, my);
        
        if (Math.abs(x2 - x1) > 5 && Math.abs(y2 - y1) > 5) {
          const selected = elements.filter(el => {
            const elRight = el.x + el.width;
            const elBottom = el.y + el.height;
            return el.x < x2 && elRight > x1 && el.y < y2 && elBottom > y1;
          }).map(el => el.id);
          
          if (selected.length > 0 && onMultiSelect) {
            onMultiSelect(selected);
          }
        }

        document.removeEventListener('pointermove', handleMove);
        document.removeEventListener('pointerup', handleUp);
      };

      document.addEventListener('pointermove', handleMove);
      document.addEventListener('pointerup', handleUp);
    }, [readOnly, onSelect, onMultiSelect, elements]);

    const resolveContent = (el: CanvasElement): string => {
      if (!variableValues) return el.content;
      let text = el.content;
      Object.entries(variableValues).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v || `{{${k}}}`);
      });
      return text;
    };

    const resolveVariable = (el: CanvasElement): string => {
      if (variableValues && el.variable) {
        return variableValues[el.variable] || `{{${el.variable}}}`;
      }
      return el.variable ? `{{${el.variable}}}` : '';
    };

    const boxSelectRect = boxSelect ? {
      left: Math.min(boxSelect.startX, boxSelect.x),
      top: Math.min(boxSelect.startY, boxSelect.y),
      width: Math.abs(boxSelect.x - boxSelect.startX),
      height: Math.abs(boxSelect.y - boxSelect.startY),
    } : null;

    const renderElement = (el: CanvasElement) => {
      const elSelected = isSelected(el.id) && !readOnly;
      const style: React.CSSProperties = {
        position: 'absolute',
        left: el.x,
        top: el.y,
        width: el.width,
        fontSize: el.fontSize,
        fontWeight: el.fontWeight,
        fontFamily: el.fontFamily,
        color: el.color,
        textAlign: el.alignment,
        cursor: readOnly ? 'default' : 'grab',
        userSelect: 'none',
      };

      if (el.type === 'logo' || el.type === 'image') {
        // height auto
      } else if (el.type !== 'divider') {
        style.height = el.height;
      }

      const selectedClass = elSelected ? 'element-selected' : '';
      const hoverClass = readOnly ? '' : 'hover:element-hover';

      const resizeHandle = elSelected ? (
        <div
          className="absolute -bottom-1 -right-1 h-5 w-5 md:h-4 md:w-4 cursor-se-resize rounded-sm bg-primary touch-none"
          onPointerDown={(e) => handlePointerDown(e, el, 'resize')}
        />
      ) : null;

      switch (el.type) {
        case 'text':
        case 'notes':
          return (
            <div
              key={el.id}
              style={style}
              className={`rounded px-1 ${selectedClass} ${hoverClass} ${el.type === 'notes' ? 'border border-border bg-accent/30 p-2' : ''}`}
              onPointerDown={(e) => handlePointerDown(e, el, 'drag')}
              onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
            >
              <span className="whitespace-pre-wrap">{resolveContent(el)}</span>
              {resizeHandle}
            </div>
          );

        case 'dynamic-field':
        case 'price-field':
        case 'total-calculation':
          return (
            <div
              key={el.id}
              style={style}
              className={`flex items-center gap-1 rounded px-1 ${selectedClass} ${hoverClass}`}
              onPointerDown={(e) => handlePointerDown(e, el, 'drag')}
              onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
            >
              {el.content && <span>{resolveContent(el)}</span>}
              <span className={`${readOnly ? '' : 'rounded bg-primary/10 px-1.5 py-0.5 font-mono text-primary'}`}>
                {resolveVariable(el)}
              </span>
              {resizeHandle}
            </div>
          );

        case 'divider':
          return (
            <div
              key={el.id}
              style={{ ...style, height: Math.max(el.height, 2), backgroundColor: el.color || '#E2E8F0' }}
              className={`rounded ${selectedClass} ${hoverClass}`}
              onPointerDown={(e) => handlePointerDown(e, el, 'drag')}
              onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
            />
          );

        case 'image':
        case 'logo': {
          const imgStyle: React.CSSProperties = {
            ...style,
            height: 'auto',
            minHeight: 20,
          };
          return (
            <div
              key={el.id}
              style={imgStyle}
              className={`flex items-center justify-center rounded ${el.imageUrl ? '' : 'border border-dashed border-border bg-accent/30'} ${selectedClass} ${hoverClass}`}
              onPointerDown={(e) => handlePointerDown(e, el, 'drag')}
              onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
            >
              {el.imageUrl ? (
                <img
                  src={el.imageUrl}
                  alt={el.type === 'logo' ? 'Logo' : 'Imagem'}
                  className="w-full rounded"
                  style={{ objectFit: 'contain', height: 'auto', maxHeight: el.height || 200 }}
                  draggable={false}
                />
              ) : (
                <div className="flex flex-col items-center gap-1 py-4">
                  <span className="text-xs text-muted-foreground">{el.type === 'logo' ? '🖼 Logo' : '🖼 Imagem'}</span>
                  <span className="text-[10px] text-muted-foreground">Selecione para enviar</span>
                </div>
              )}
              {resizeHandle}
            </div>
          );
        }

        case 'table':
          return (
            <div
              key={el.id}
              style={{ ...style, height: el.height, overflow: 'hidden' }}
              className={`rounded border border-border ${selectedClass} ${hoverClass}`}
              onPointerDown={(e) => handlePointerDown(e, el, 'drag')}
              onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
            >
              <table className="h-full w-full text-xs">
                <tbody>
                  {(el.rows || []).map((row, ri) => (
                    <tr key={ri} className={ri === 0 ? 'bg-accent font-semibold' : ''}>
                      {row.cells.map((cell, ci) => (
                        <td key={ci} className="border-b border-r border-border px-2 py-1 last:border-r-0">
                          {variableValues ? resolveContent({ ...el, content: cell }) : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {resizeHandle}
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div
        ref={(node) => {
          (canvasElRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={`canvas-paper relative touch-none ${!readOnly ? 'grid-dots' : ''}`}
        style={{ width: CANVAS_W, height: CANVAS_H, minWidth: CANVAS_W, minHeight: CANVAS_H }}
        onPointerDown={handleCanvasPointerDown}
      >
        {elements.map(renderElement)}
        {boxSelectRect && (
          <div
            className="absolute border-2 border-primary/50 bg-primary/10 pointer-events-none"
            style={{
              left: boxSelectRect.left,
              top: boxSelectRect.top,
              width: boxSelectRect.width,
              height: boxSelectRect.height,
            }}
          />
        )}
      </div>
    );
  }
);

CanvasRenderer.displayName = 'CanvasRenderer';
export default CanvasRenderer;
