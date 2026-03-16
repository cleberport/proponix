import { forwardRef, useCallback, useState, useRef } from 'react';
import { CanvasElement } from '@/types/template';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  elements: CanvasElement[];
  selectedId: string | null;
  selectedIds?: string[];
  onSelect: (id: string | null) => void;
  onMultiSelect?: (ids: string[]) => void;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onAddElement?: (element: CanvasElement) => void;
  readOnly?: boolean;
  variableValues?: Record<string, string>;
  showGrid?: boolean;
  backgroundColor?: string;
}

const CANVAS_W = 595;
const CANVAS_H = 842;
const GRID = 10;

const snap = (v: number) => Math.round(v / GRID) * GRID;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const OBJECT_POSITION_PRESETS: Record<string, { x: number; y: number }> = {
  'top left': { x: 0, y: 0 },
  'top center': { x: 50, y: 0 },
  'top right': { x: 100, y: 0 },
  'center left': { x: 0, y: 50 },
  center: { x: 50, y: 50 },
  'center right': { x: 100, y: 50 },
  'bottom left': { x: 0, y: 100 },
  'bottom center': { x: 50, y: 100 },
  'bottom right': { x: 100, y: 100 },
  top: { x: 50, y: 0 },
  bottom: { x: 50, y: 100 },
  left: { x: 0, y: 50 },
  right: { x: 100, y: 50 },
};

const resolveObjectPositionPercent = (el: CanvasElement): { x: number; y: number } => {
  if (typeof el.objectPositionX === 'number' && typeof el.objectPositionY === 'number') {
    return { x: clamp(el.objectPositionX, 0, 100), y: clamp(el.objectPositionY, 0, 100) };
  }

  const presetKey = (el.objectPosition || 'center').toLowerCase();
  return OBJECT_POSITION_PRESETS[presetKey] || OBJECT_POSITION_PRESETS.center;
};

const CanvasRenderer = forwardRef<HTMLDivElement, Props>(
  ({ elements, selectedId, selectedIds = [], onSelect, onMultiSelect, onUpdate, onAddElement, readOnly, variableValues, showGrid = true, backgroundColor }, ref) => {
    const [dragging, setDragging] = useState<string | null>(null);
    const [resizing, setResizing] = useState<string | null>(null);
    const [editingImageId, setEditingImageId] = useState<string | null>(null);
    const [boxSelect, setBoxSelect] = useState<{ startX: number; startY: number; x: number; y: number } | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const startPos = useRef({ x: 0, y: 0, elX: 0, elY: 0, elW: 0, elH: 0 });
    const canvasElRef = useRef<HTMLDivElement>(null);

    const isSelected = (id: string) => selectedIds.includes(id) || selectedId === id;

    const handlePointerDown = useCallback(
      (e: React.PointerEvent, el: CanvasElement, mode: 'drag' | 'resize') => {
        if (readOnly || el.locked) return;
        e.stopPropagation();
        e.preventDefault();
        onSelect(el.id);
        if (editingImageId !== el.id) setEditingImageId(null);
        startPos.current = { x: e.clientX, y: e.clientY, elX: el.x, elY: el.y, elW: el.width, elH: el.height };
        if (mode === 'drag') setDragging(el.id);
        else setResizing(el.id);

        const isLogo = el.type === 'logo';
        const aspectRatio = isLogo && el.height > 0 ? el.width / el.height : 0;

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
              const maxX = Math.max(0, CANVAS_W - el.width);
              const maxY = Math.max(0, CANVAS_H - el.height);
              onUpdate(el.id, {
                x: snap(Math.max(0, Math.min(maxX, startPos.current.elX + dx))),
                y: snap(Math.max(0, Math.min(maxY, startPos.current.elY + dy))),
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
      [onSelect, onUpdate, readOnly, selectedIds, elements, editingImageId]
    );

    const handleImagePanPointerDown = useCallback(
      (e: React.PointerEvent, el: CanvasElement) => {
        if (readOnly || el.locked) return;
        e.stopPropagation();
        e.preventDefault();
        onSelect(el.id);

        const startX = e.clientX;
        const startY = e.clientY;
        const startOffsetX = el.imageOffsetX || 0;
        const startOffsetY = el.imageOffsetY || 0;

        const handleMove = (ev: PointerEvent) => {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;

          onUpdate(el.id, {
            imageOffsetX: startOffsetX + dx,
            imageOffsetY: startOffsetY + dy,
          });
        };

        const handleUp = () => {
          document.removeEventListener('pointermove', handleMove);
          document.removeEventListener('pointerup', handleUp);
        };

        document.addEventListener('pointermove', handleMove);
        document.addEventListener('pointerup', handleUp);
      },
      [onSelect, onUpdate, readOnly]
    );

    const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
      if (readOnly) return;
      setEditingImageId(null);
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

    // Drag & drop images
    const handleDragOver = useCallback((e: React.DragEvent) => {
      if (readOnly) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setDragOver(true);
    }, [readOnly]);

    const handleDragLeave = useCallback(() => {
      setDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (readOnly || !onAddElement) return;

      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (files.length === 0) return;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const dropX = snap(Math.max(0, e.clientX - rect.left - 75));
      const dropY = snap(Math.max(0, e.clientY - rect.top - 40));

      files.forEach((file, i) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const url = ev.target?.result as string;
          const img = new Image();
          img.onload = () => {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            let width = Math.min(200, CANVAS_W - 20);
            let height = Math.round(width / aspectRatio);
            if (height > CANVAS_H - 20) {
              height = CANVAS_H - 20;
              width = Math.round(height * aspectRatio);
            }
            const newEl: CanvasElement = {
              id: uuidv4(),
              type: 'image',
              x: snap(Math.min(Math.max(0, CANVAS_W - width), dropX + i * 20)),
              y: snap(Math.min(Math.max(0, CANVAS_H - height), dropY + i * 20)),
              width,
              height,
              content: '',
              imageUrl: url,
              objectFit: 'contain',
              isVisible: true,
              fieldCategory: 'default',
            };
            onAddElement(newEl);
          };
          img.src = url;
        };
        reader.readAsDataURL(file);
      });
    }, [readOnly, onAddElement]);

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
        // Height managed by container style in image rendering
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
          const hasCrop = el.cropX || el.cropY || (el.cropWidth && el.cropWidth < 100) || (el.cropHeight && el.cropHeight < 100);
          const cropX = el.cropX || 0;
          const cropY = el.cropY || 0;
          const cropW = el.cropWidth || 100;
          const cropH = el.cropHeight || 100;

          const filterParts: string[] = [];
          if (el.imageBrightness != null && el.imageBrightness !== 100) filterParts.push(`brightness(${el.imageBrightness / 100})`);
          if (el.imageContrast != null && el.imageContrast !== 100) filterParts.push(`contrast(${el.imageContrast / 100})`);
          if (el.imageSaturation != null && el.imageSaturation !== 100) filterParts.push(`saturate(${el.imageSaturation / 100})`);
          const filterStr = filterParts.length > 0 ? filterParts.join(' ') : undefined;

          const imgContainerStyle: React.CSSProperties = {
            ...style,
            height: el.height || 'auto',
            minHeight: 20,
            overflow: 'hidden',
            borderWidth: el.borderWidth || 0,
            borderStyle: (el.borderWidth || 0) > 0 ? 'solid' : 'none',
            borderColor: el.borderColor || '#000000',
            borderRadius: el.borderRadius || 0,
            opacity: (el.imageOpacity ?? 100) / 100,
            transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
            cursor: el.locked ? 'not-allowed' : (editingImageId === el.id ? 'move' : (readOnly ? 'default' : 'grab')),
          };

          const scale = el.imageScale || 1;
          const offsetX = el.imageOffsetX || 0;
          const offsetY = el.imageOffsetY || 0;

          const imgInnerStyle: React.CSSProperties = {
            filter: filterStr,
            width: '100%',
            height: '100%',
            objectFit: scale > 1 ? 'cover' : ((el.objectFit as React.CSSProperties['objectFit']) || 'contain'),
            objectPosition: el.objectPosition || 'center',
            transform: `scale(${scale}) translate(${offsetX / scale}px, ${offsetY / scale}px)`,
            transformOrigin: 'center center',
          };

          if (hasCrop) {
            // Use clip-path for cropping
            imgInnerStyle.clipPath = `inset(${cropY}% ${100 - cropX - cropW}% ${100 - cropY - cropH}% ${cropX}%)`;
          }

          return (
            <div
              key={el.id}
              style={imgContainerStyle}
              className={`relative flex items-center justify-center ${el.imageUrl ? '' : 'border border-dashed border-border bg-accent/30'} ${selectedClass} ${hoverClass} ${editingImageId === el.id ? 'ring-2 ring-primary ring-inset' : ''}`}
              onPointerDown={(e) => {
                if (editingImageId === el.id) {
                  handleImagePanPointerDown(e, el);
                  return;
                }
                handlePointerDown(e, el, 'drag');
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (!readOnly && !el.locked) {
                  setEditingImageId((prev) => (prev === el.id ? null : el.id));
                  onSelect(el.id);
                }
              }}
              onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
            >
              {el.imageUrl ? (
                <img
                  src={el.imageUrl}
                  alt={el.type === 'logo' ? 'Logo' : 'Imagem'}
                  className="rounded"
                  style={imgInnerStyle}
                  draggable={false}
                />
              ) : (
                <div className="flex flex-col items-center gap-1 py-4">
                  <span className="text-xs text-muted-foreground">{el.type === 'logo' ? '🖼 Logo' : '🖼 Imagem'}</span>
                  <span className="text-[10px] text-muted-foreground">Arraste uma imagem ou selecione para enviar</span>
                </div>
              )}
              {el.locked && elSelected && (
                <div className="absolute top-1 left-1 rounded bg-card/80 p-0.5">
                  <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
              )}
              {editingImageId === el.id && !el.locked && (
                <div className="pointer-events-none absolute bottom-1 left-1 rounded bg-card/85 px-1.5 py-0.5 text-[10px] text-foreground">
                  Reenquadrando • arraste a foto
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
              className={`rounded border border-gray-400 ${selectedClass} ${hoverClass}`}
              onPointerDown={(e) => handlePointerDown(e, el, 'drag')}
              onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
            >
              <table className="h-full w-full text-xs" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                {el.columnWidths && (
                  <colgroup>
                    {el.columnWidths.map((w, ci) => (
                      <col key={ci} style={{ width: `${w}%` }} />
                    ))}
                  </colgroup>
                )}
                <tbody>
                  {(el.rows || []).map((row, ri) => (
                    <tr key={ri} style={ri === 0 ? { backgroundColor: 'hsl(240 5% 88%)', fontWeight: 600 } : undefined}>
                      {row.cells.map((cell, ci) => (
                        <td
                          key={ci}
                          className="px-2 py-1.5"
                          style={{
                            borderBottom: '1px solid hsl(240 5% 82%)',
                            borderRight: ci < row.cells.length - 1 ? '1px solid hsl(240 5% 82%)' : 'none',
                            color: el.color || '#0F172A',
                          }}
                        >
                          {variableValues ? resolveContent({ ...el, content: cell }) : (cell || (ri > 0 ? '\u00A0' : ''))}
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
        className={`canvas-paper relative touch-none ${!readOnly && showGrid ? 'grid-dots' : ''} ${dragOver ? 'ring-2 ring-primary ring-inset' : ''}`}
        style={{ width: CANVAS_W, height: CANVAS_H, minWidth: CANVAS_W, minHeight: CANVAS_H, backgroundColor: backgroundColor || '#ffffff' }}
        onPointerDown={handleCanvasPointerDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/5 pointer-events-none">
            <div className="rounded-lg bg-card px-4 py-2 shadow-lg border border-primary/30">
              <p className="text-sm font-medium text-primary">Solte a imagem aqui</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

CanvasRenderer.displayName = 'CanvasRenderer';
export default CanvasRenderer;
