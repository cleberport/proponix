import { forwardRef, useCallback, useState, useRef } from 'react';
import { CanvasElement } from '@/types/template';

interface Props {
  elements: CanvasElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  readOnly?: boolean;
  variableValues?: Record<string, string>;
}

const CANVAS_W = 595;
const CANVAS_H = 842;
const GRID = 10;

const snap = (v: number) => Math.round(v / GRID) * GRID;

const CanvasRenderer = forwardRef<HTMLDivElement, Props>(
  ({ elements, selectedId, onSelect, onUpdate, readOnly, variableValues }, ref) => {
    const [dragging, setDragging] = useState<string | null>(null);
    const [resizing, setResizing] = useState<string | null>(null);
    const startPos = useRef({ x: 0, y: 0, elX: 0, elY: 0, elW: 0, elH: 0 });

    const handlePointerDown = useCallback(
      (e: React.PointerEvent, el: CanvasElement, mode: 'drag' | 'resize') => {
        if (readOnly) return;
        e.stopPropagation();
        e.preventDefault();
        onSelect(el.id);
        startPos.current = { x: e.clientX, y: e.clientY, elX: el.x, elY: el.y, elW: el.width, elH: el.height };
        if (mode === 'drag') setDragging(el.id);
        else setResizing(el.id);

        const handleMove = (ev: PointerEvent) => {
          const dx = ev.clientX - startPos.current.x;
          const dy = ev.clientY - startPos.current.y;
          if (mode === 'drag') {
            onUpdate(el.id, {
              x: snap(Math.max(0, Math.min(CANVAS_W - el.width, startPos.current.elX + dx))),
              y: snap(Math.max(0, Math.min(CANVAS_H - el.height, startPos.current.elY + dy))),
            });
          } else {
            onUpdate(el.id, {
              width: snap(Math.max(40, startPos.current.elW + dx)),
              height: snap(Math.max(10, startPos.current.elH + dy)),
            });
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
      [onSelect, onUpdate, readOnly]
    );

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

    const renderElement = (el: CanvasElement) => {
      const isSelected = selectedId === el.id && !readOnly;
      const style: React.CSSProperties = {
        position: 'absolute',
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.type === 'divider' ? undefined : el.height,
        fontSize: el.fontSize,
        fontWeight: el.fontWeight,
        fontFamily: el.fontFamily,
        color: el.color,
        textAlign: el.alignment,
        cursor: readOnly ? 'default' : 'grab',
        userSelect: 'none',
      };

      const selectedClass = isSelected ? 'element-selected' : '';
      const hoverClass = readOnly ? '' : 'hover:element-hover';

      switch (el.type) {
        case 'text':
        case 'notes':
          return (
            <div
              key={el.id}
              style={style}
              className={`rounded px-1 ${selectedClass} ${hoverClass} ${el.type === 'notes' ? 'border border-border bg-accent/30 p-2' : ''}`}
              onMouseDown={(e) => handleMouseDown(e, el, 'drag')}
              onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
            >
              <span className="whitespace-pre-wrap">{resolveContent(el)}</span>
              {isSelected && (
                <div
                  className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded-sm bg-primary"
                  onMouseDown={(e) => handleMouseDown(e, el, 'resize')}
                />
              )}
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
              onMouseDown={(e) => handleMouseDown(e, el, 'drag')}
              onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
            >
              {el.content && <span>{resolveContent(el)}</span>}
              <span className={`${readOnly ? '' : 'rounded bg-primary/10 px-1.5 py-0.5 font-mono text-primary'}`}>
                {resolveVariable(el)}
              </span>
              {isSelected && (
                <div
                  className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded-sm bg-primary"
                  onMouseDown={(e) => handleMouseDown(e, el, 'resize')}
                />
              )}
            </div>
          );

        case 'divider':
          return (
            <div
              key={el.id}
              style={{ ...style, height: Math.max(el.height, 2), backgroundColor: el.color || '#E2E8F0' }}
              className={`rounded ${selectedClass} ${hoverClass}`}
              onMouseDown={(e) => handleMouseDown(e, el, 'drag')}
              onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
            />
          );

        case 'image':
        case 'logo':
          return (
            <div
              key={el.id}
              style={style}
              className={`flex items-center justify-center rounded ${el.imageUrl ? '' : 'border border-dashed border-border bg-accent/30'} ${selectedClass} ${hoverClass}`}
              onMouseDown={(e) => handleMouseDown(e, el, 'drag')}
              onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
            >
              {el.imageUrl ? (
                <img
                  src={el.imageUrl}
                  alt={el.type === 'logo' ? 'Logo' : 'Image'}
                  className="h-full w-full rounded"
                  style={{ objectFit: el.objectFit || 'contain' }}
                  draggable={false}
                />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{el.type === 'logo' ? '🖼 Logo' : '🖼 Image'}</span>
                  <span className="text-[10px] text-muted-foreground">Select to upload</span>
                </div>
              )}
              {isSelected && (
                <div
                  className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded-sm bg-primary"
                  onMouseDown={(e) => handleMouseDown(e, el, 'resize')}
                />
              )}
            </div>
          );

        case 'table':
          return (
            <div
              key={el.id}
              style={{ ...style, overflow: 'hidden' }}
              className={`rounded border border-border ${selectedClass} ${hoverClass}`}
              onMouseDown={(e) => handleMouseDown(e, el, 'drag')}
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
              {isSelected && (
                <div
                  className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded-sm bg-primary"
                  onMouseDown={(e) => handleMouseDown(e, el, 'resize')}
                />
              )}
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div
        ref={ref}
        className={`canvas-paper relative ${!readOnly ? 'grid-dots' : ''}`}
        style={{ width: CANVAS_W, height: CANVAS_H, minWidth: CANVAS_W, minHeight: CANVAS_H }}
        onClick={() => !readOnly && onSelect(null)}
      >
        {elements.map(renderElement)}
      </div>
    );
  }
);

CanvasRenderer.displayName = 'CanvasRenderer';
export default CanvasRenderer;
