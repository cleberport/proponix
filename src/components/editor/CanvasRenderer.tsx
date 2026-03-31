import { forwardRef, useCallback, useState, useRef, useEffect } from 'react';
import { CanvasElement } from '@/types/template';
import { v4 as uuidv4 } from 'uuid';
import { optimizeImageFile } from '@/lib/imageOptimization';
import { resolveTextColor, isDark } from '@/lib/colorContrast';
import { getServiceLayout, getSingleLineTextLayout } from '@/lib/absoluteLayout';

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
  clipOverflow?: boolean;
}

const CANVAS_W = 595;
const CANVAS_H = 842;
const GRID = 10;
const SNAP_THRESHOLD = 5;

const snap = (v: number) => Math.round(v / GRID) * GRID;

const getColumnPixelWidths = (totalWidth: number, columnCount: number, percentages?: number[]) => {
  if (columnCount <= 0) return [] as number[];

  const raw = percentages && percentages.length === columnCount
    ? percentages
    : Array.from({ length: columnCount }, () => 100 / columnCount);

  const sum = raw.reduce((acc, value) => acc + value, 0) || columnCount;
  let consumed = 0;

  return raw.map((value, index) => {
    if (index === columnCount - 1) {
      return Math.max(0, totalWidth - consumed);
    }

    const width = Math.max(0, Math.round((value / sum) * totalWidth));
    consumed += width;
    return width;
  });
};

interface AlignGuide {
  pos: number;
  orientation: 'h' | 'v';
}

function computeElementSnap(
  el: { x: number; y: number; width: number; height: number },
  others: { x: number; y: number; width: number; height: number }[],
): { x: number | null; y: number | null; guides: AlignGuide[] } {
  const guides: AlignGuide[] = [];
  let bestDx = SNAP_THRESHOLD + 1;
  let bestDy = SNAP_THRESHOLD + 1;
  let snapX: number | null = null;
  let snapY: number | null = null;

  const dragEdgesX = [el.x, el.x + el.width / 2, el.x + el.width];
  const dragEdgesY = [el.y, el.y + el.height / 2, el.y + el.height];

  // Include canvas edges + center as snap targets
  const targets = [
    ...others,
    { x: 0, y: 0, width: CANVAS_W, height: CANVAS_H },
  ];

  for (const other of targets) {
    const otherEdgesX = [other.x, other.x + other.width / 2, other.x + other.width];
    const otherEdgesY = [other.y, other.y + other.height / 2, other.y + other.height];

    for (const de of dragEdgesX) {
      for (const oe of otherEdgesX) {
        const d = Math.abs(de - oe);
        if (d <= SNAP_THRESHOLD && d < bestDx) {
          bestDx = d;
          snapX = el.x + (oe - de);
        }
      }
    }

    for (const de of dragEdgesY) {
      for (const oe of otherEdgesY) {
        const d = Math.abs(de - oe);
        if (d <= SNAP_THRESHOLD && d < bestDy) {
          bestDy = d;
          snapY = el.y + (oe - de);
        }
      }
    }
  }

  // Generate guide lines for snapped positions
  if (snapX !== null) {
    const finalEdgesX = [snapX, snapX + el.width / 2, snapX + el.width];
    for (const other of targets) {
      for (const oe of [other.x, other.x + other.width / 2, other.x + other.width]) {
        for (const fe of finalEdgesX) {
          if (Math.abs(fe - oe) < 1 && !guides.some(g => g.orientation === 'v' && Math.abs(g.pos - oe) < 1)) {
            guides.push({ pos: oe, orientation: 'v' });
          }
        }
      }
    }
  }

  if (snapY !== null) {
    const finalEdgesY = [snapY, snapY + el.height / 2, snapY + el.height];
    for (const other of targets) {
      for (const oe of [other.y, other.y + other.height / 2, other.y + other.height]) {
        for (const fe of finalEdgesY) {
          if (Math.abs(fe - oe) < 1 && !guides.some(g => g.orientation === 'h' && Math.abs(g.pos - oe) < 1)) {
            guides.push({ pos: oe, orientation: 'h' });
          }
        }
      }
    }
  }

  return { x: snapX, y: snapY, guides };
}

const CanvasRenderer = forwardRef<HTMLDivElement, Props>(
  ({ elements, selectedId, selectedIds = [], onSelect, onMultiSelect, onUpdate, onAddElement, readOnly, variableValues, showGrid = true, backgroundColor, clipOverflow = false }, ref) => {
    const [dragging, setDragging] = useState<string | null>(null);
    const [resizing, setResizing] = useState<string | null>(null);
    
    const [editingTextId, setEditingTextId] = useState<string | null>(null);
    const [boxSelect, setBoxSelect] = useState<{ startX: number; startY: number; x: number; y: number } | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [guides, setGuides] = useState<AlignGuide[]>([]);
    const startPos = useRef({ x: 0, y: 0, elX: 0, elY: 0, elW: 0, elH: 0 });
    const canvasElRef = useRef<HTMLDivElement>(null);
    const elementsRef = useRef(elements);

    useEffect(() => {
      elementsRef.current = elements;
    }, [elements]);

    const isSelected = (id: string) => selectedIds.includes(id) || selectedId === id;

    const handlePointerDown = useCallback(
      (e: React.PointerEvent, el: CanvasElement, mode: 'drag' | 'resize') => {
        if (readOnly || el.locked) return;
        e.stopPropagation();
        e.preventDefault();
        onSelect(el.id);
        if (editingTextId !== el.id) setEditingTextId(null);
        startPos.current = { x: e.clientX, y: e.clientY, elX: el.x, elY: el.y, elW: el.width, elH: el.height };
        if (mode === 'drag') setDragging(el.id);
        else setResizing(el.id);

        const isLogo = el.type === 'logo';
        const aspectRatio = isLogo && el.height > 0 ? el.width / el.height : 0;

        const multiDragStart = selectedIds.includes(el.id) && selectedIds.length > 1 && mode === 'drag'
          ? elementsRef.current.filter(e => selectedIds.includes(e.id)).map(e => ({ id: e.id, x: e.x, y: e.y }))
          : null;

        const handleMove = (ev: PointerEvent) => {
          const dx = ev.clientX - startPos.current.x;
          const dy = ev.clientY - startPos.current.y;
          if (mode === 'drag') {
            if (multiDragStart) {
              multiDragStart.forEach(item => {
                onUpdate(item.id, {
                  x: snap(item.x + dx),
                  y: snap(item.y + dy),
                });
              });
              setGuides([]);
            } else {
              const isImageEl = el.type === 'image' || el.type === 'logo';
              let newX = startPos.current.elX + dx;
              let newY = startPos.current.elY + dy;

              if (!isImageEl) {
                // Non-image elements stay within canvas bounds
                const maxX = Math.max(0, CANVAS_W - el.width);
                const maxY = Math.max(0, CANVAS_H - el.height);
                newX = Math.max(0, Math.min(maxX, newX));
                newY = Math.max(0, Math.min(maxY, newY));
              }

              // Compute snap against other elements
              const others = elementsRef.current.filter(e => e.id !== el.id);
              const snapResult = computeElementSnap(
                { x: newX, y: newY, width: el.width, height: el.height },
                others,
              );

              if (snapResult.x !== null) newX = isImageEl ? snapResult.x : Math.max(0, Math.min(Math.max(0, CANVAS_W - el.width), snapResult.x));
              else newX = snap(newX);

              if (snapResult.y !== null) newY = isImageEl ? snapResult.y : Math.max(0, Math.min(Math.max(0, CANVAS_H - el.height), snapResult.y));
              else newY = snap(newY);

              setGuides(snapResult.guides);
              onUpdate(el.id, { x: newX, y: newY });
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
          setGuides([]);
          document.removeEventListener('pointermove', handleMove);
          document.removeEventListener('pointerup', handleUp);
        };

        document.addEventListener('pointermove', handleMove);
        document.addEventListener('pointerup', handleUp);
      },
      [onSelect, onUpdate, readOnly, selectedIds]
    );

    // handleImagePanPointerDown removed — images are now free elements

    const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
      if (readOnly) return;
      setEditingTextId(null);
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
          const selected = elementsRef.current.filter(el => {
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
    }, [readOnly, onSelect, onMultiSelect]);

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
        void (async () => {
          try {
            const url = await optimizeImageFile(file, {
              maxDimension: 1800,
              targetBytes: 800_000,
            });

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
                imageScale: 1,
                imageOffsetX: 0,
                imageOffsetY: 0,
                isVisible: true,
                fieldCategory: 'default',
              };
              onAddElement(newEl);
            };
            img.src = url;
          } catch (error) {
            console.error('Erro ao otimizar imagem de upload:', error);
          }
        })();
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
        const val = variableValues[el.variable];
        if (val) return val;
        // In readOnly mode, don't show placeholder
        return readOnly ? '' : `{{${el.variable}}}`;
      }
      return readOnly ? '' : (el.variable ? `{{${el.variable}}}` : '');
    };

    const renderTextContent = (el: CanvasElement): React.ReactNode => {
      const content = resolveContent(el);
      if (!el.listType || el.listType === 'none') return content;
      const lines = content.split('\n');
      return (
        <>
          {lines.map((line, i) => (
            <span key={i} style={{ display: 'block' }}>
              {el.listType === 'bullet' ? `• ${line}` : `${i + 1}. ${line}`}
            </span>
          ))}
        </>
      );
    };

    const boxSelectRect = boxSelect ? {
      left: Math.min(boxSelect.startX, boxSelect.x),
      top: Math.min(boxSelect.startY, boxSelect.y),
      width: Math.abs(boxSelect.x - boxSelect.startX),
      height: Math.abs(boxSelect.y - boxSelect.startY),
    } : null;

    const renderElement = (el: CanvasElement, elIndex: number) => {
      const elSelected = isSelected(el.id) && !readOnly;
      const lh = el.lineHeight || 1.4;
      const ls = el.letterSpacing ? `${el.letterSpacing}em` : undefined;
      const style: React.CSSProperties = {
        position: 'absolute',
        left: el.x,
        top: el.y,
        width: el.width,
        fontSize: el.fontSize,
        fontWeight: el.fontWeight,
        fontFamily: el.fontFamily,
        fontStyle: el.fontStyle || 'normal',
        textDecoration: el.textDecoration || 'none',
        lineHeight: lh,
        letterSpacing: ls,
        color: resolveTextColor(el.color, backgroundColor),
        textAlign: el.alignment,
        cursor: readOnly ? 'default' : (editingTextId === el.id ? 'text' : 'grab'),
        userSelect: editingTextId === el.id ? 'text' : 'none',
        zIndex: elIndex + 1,
      };

      if (el.type === 'logo' || el.type === 'image') {
        // Height managed by container style in image rendering
      } else if (el.type !== 'divider') {
        style.height = el.height;
      }

      const isImageType = el.type === 'image' || el.type === 'logo';
      const selectedClass = elSelected ? (isImageType ? 'element-selected-image' : 'element-selected') : '';
      const hoverClass = readOnly ? '' : 'hover:element-hover';

      const resizeHandle = elSelected ? (
        <div
          className="absolute -bottom-1 -right-1 h-5 w-5 md:h-4 md:w-4 cursor-se-resize rounded-sm bg-primary touch-none"
          onPointerDown={(e) => handlePointerDown(e, el, 'resize')}
        />
      ) : null;

      switch (el.type) {
        case 'text':
        case 'notes': {
          const isEditingThis = editingTextId === el.id && !readOnly;
          return (
            <div
              key={el.id}
              style={style}
              className={`rounded px-1 ${selectedClass} ${hoverClass} ${el.type === 'notes' ? 'border border-border bg-accent/30 p-2' : ''}`}
              onPointerDown={(e) => {
                if (isEditingThis) {
                  e.stopPropagation();
                  return;
                }
                handlePointerDown(e, el, 'drag');
              }}
              onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (!readOnly && !el.locked) {
                  setEditingTextId(el.id);
                  onSelect(el.id);
                }
              }}
            >
              {isEditingThis ? (
                <textarea
                  autoFocus
                  value={el.content}
                  className="w-full h-full bg-transparent outline-none resize-none whitespace-pre-wrap"
                  style={{
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    fontFamily: 'inherit',
                    fontStyle: 'inherit',
                    color: 'inherit',
                    textAlign: el.alignment || 'left',
                    textDecoration: el.textDecoration || 'none',
                    lineHeight: lh,
                    border: 'none',
                    padding: 0,
                    margin: 0,
                  }}
                  onChange={(e) => {
                    onUpdate(el.id, { content: e.target.value });
                  }}
                  onBlur={() => {
                    setEditingTextId(null);
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Escape') {
                      setEditingTextId(null);
                    }
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="whitespace-pre-wrap">{renderTextContent(el)}</span>
              )}
              {resizeHandle}
            </div>
          );
        }

        case 'dynamic-field':
        case 'price-field':
        case 'total-calculation': {
          const fontSize = el.fontSize || 14;
          const fieldLayout = getSingleLineTextLayout({ width: el.width, height: el.height, fontSize });
          const varValue = resolveVariable(el);
          const showContent = el.content && (!readOnly || varValue);
          const displayText = showContent
            ? `${resolveContent(el)} ${varValue}`
            : varValue;

          return (
            <div
              key={el.id}
              style={{
                ...style,
                overflow: 'hidden',
                height: el.height,
                padding: 0,
              }}
              className={`${selectedClass} ${hoverClass}`}
              onPointerDown={(e) => handlePointerDown(e, el, 'drag')}
              onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: fieldLayout.left,
                  top: fieldLayout.top,
                  width: fieldLayout.width,
                  height: fieldLayout.height,
                  fontSize,
                  lineHeight: `${fieldLayout.lineHeightPx}px`,
                  color: resolveTextColor(el.color, backgroundColor),
                  textAlign: el.alignment || 'left',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  pointerEvents: 'none',
                }}
              >
                {displayText}
              </div>
              {resizeHandle}
            </div>
          );
        }

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
          const filterParts: string[] = [];
          if (el.imageBrightness != null && el.imageBrightness !== 100) filterParts.push(`brightness(${el.imageBrightness / 100})`);
          if (el.imageContrast != null && el.imageContrast !== 100) filterParts.push(`contrast(${el.imageContrast / 100})`);
          if (el.imageSaturation != null && el.imageSaturation !== 100) filterParts.push(`saturate(${el.imageSaturation / 100})`);
          const filterStr = filterParts.length > 0 ? filterParts.join(' ') : undefined;

          const isLogoEl = el.type === 'logo';
          const logoDarkBg = isLogoEl && isDark(backgroundColor);
          const logoFilter = logoDarkBg ? 'brightness(0) invert(1)' : undefined;
          const combinedFilter = isLogoEl ? logoFilter : filterStr;

          const imgContainerStyle: React.CSSProperties = {
            ...style,
            height: el.height || 'auto',
            minHeight: 20,
            borderWidth: el.borderWidth || 0,
            borderStyle: (el.borderWidth || 0) > 0 ? 'solid' : 'none',
            borderColor: el.borderColor || '#000000',
            borderRadius: el.borderRadius || 0,
            opacity: (el.imageOpacity ?? 100) / 100,
            transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
            cursor: el.locked ? 'not-allowed' : (readOnly ? 'default' : 'grab'),
          };

          return (
            <div
              key={el.id}
              style={imgContainerStyle}
              className={`relative ${el.imageUrl ? '' : 'border border-dashed border-border bg-accent/30'} ${selectedClass} ${hoverClass}`}
              onPointerDown={(e) => {
                if (readOnly) return;
                handlePointerDown(e, el, 'drag');
              }}
              onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
            >
              {el.imageUrl ? (
                <img
                  src={el.imageUrl}
                  alt={el.type === 'logo' ? 'Logo' : 'Imagem'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: isLogoEl ? 'contain' : (el.objectFit || 'cover'),
                    filter: combinedFilter,
                    pointerEvents: 'none',
                  }}
                  draggable={false}
                />
              ) : el.type === 'logo' ? (
                <div className="group/logo relative flex items-center justify-center h-full" title="Adicione seu logo em Configurações → Empresa → Logo">
                  <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: isDark(backgroundColor) ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)' }}>SEU LOGO AQUI</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-1 py-4">
                  <span className="text-xs text-muted-foreground">🖼 Imagem</span>
                  <span className="text-[10px] text-muted-foreground">Arraste ou clique para enviar</span>
                </div>
              )}
              {/* Corner handles for images (Canva-style) */}
              {elSelected && (
                <>
                  <div className="absolute -top-1 -left-1 h-2.5 w-2.5 rounded-sm bg-white border-2 border-primary pointer-events-none" />
                  <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-sm bg-white border-2 border-primary pointer-events-none" />
                  <div className="absolute -bottom-1 -left-1 h-2.5 w-2.5 rounded-sm bg-white border-2 border-primary pointer-events-none" />
                  <div
                    className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-sm bg-white border-2 border-primary cursor-se-resize touch-none"
                    onPointerDown={(e) => handlePointerDown(e, el, 'resize')}
                  />
                </>
              )}
            </div>
          );
        }

        case 'table':
        {
          const rows = el.rows || [];
          const columnCount = rows[0]?.cells.length || 0;
          const columnWidths = getColumnPixelWidths(el.width, columnCount, el.columnWidths);
          const rowHeight = rows.length > 0 ? el.height / rows.length : el.height;

          return (
            <div
              key={el.id}
              className={`rounded ${selectedClass} ${hoverClass}`}
              style={{ ...style, height: el.height, overflow: 'hidden', border: `1px solid ${el.tableBorderColor || '#9CA3AF'}` }}
              onPointerDown={(e) => handlePointerDown(e, el, 'drag')}
              onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
            >
              {rows.map((row, ri) => {
                let offsetX = 0;

                return row.cells.map((rawCell, ci) => {
                  const cell = typeof rawCell === 'object' && rawCell !== null ? (rawCell as any).content ?? '' : String(rawCell ?? '');
                  const cellWidth = columnWidths[ci] ?? 0;
                  const left = offsetX;
                  offsetX += cellWidth;

                  return (
                    <div
                      key={`${ri}-${ci}`}
                      style={{
                        position: 'absolute',
                        left,
                        top: ri * rowHeight,
                        width: cellWidth,
                        height: rowHeight,
                        padding: '6px 8px',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        borderRight: ci < row.cells.length - 1 ? `1px solid ${el.tableBorderColor || '#C8CCD4'}` : 'none',
                        borderBottom: `1px solid ${el.tableBorderColor || '#C8CCD4'}`,
                        backgroundColor: ri === 0 ? (el.tableHeaderBg || '#DCDFE4') : (el.tableRowBg || 'transparent'),
                        color: resolveTextColor(el.color, backgroundColor),
                        fontSize: Math.max((el.fontSize || 12) * 0.85, 10),
                        fontWeight: ri === 0 ? 600 : 400,
                        lineHeight: '1.25',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {variableValues ? resolveContent({ ...el, content: cell }) : (cell || (ri > 0 ? '\u00A0' : ''))}
                    </div>
                  );
                });
              })}
              {resizeHandle}
            </div>
          );
        }

        case 'service': {
          const count = el.serviceCount || 3;
          const textColor = resolveTextColor(el.color, backgroundColor);
          const borderColor = el.tableBorderColor || (backgroundColor && backgroundColor !== '#ffffff' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)');
          const bgOpacity = (el.bgOpacity ?? 100) / 100;
          const showPrice = el.showPrice !== false;
          const fontSize = el.fontSize || 14;
          const itemHeight = Math.max(Math.floor(el.height / count), 20);

          // Build items: real data or mockup (mockup only in editor, not in readOnly/generate)
          const items: { name: string; desc: string; price: string }[] = [];
          for (let i = 0; i < count; i++) {
            const realName = variableValues?.[`service_${i}_name`];
            const realDesc = variableValues?.[`service_${i}_description`];
            const realPrice = variableValues?.[`service_${i}_price`];
            if (realName) {
              items.push({ name: realName, desc: realDesc || '', price: realPrice || '' });
            } else if (!readOnly) {
              const num = String(i + 1).padStart(2, '0');
              items.push({ name: `Item ${num}`, desc: `Descrição do item ${num}`, price: `R$ ${((i + 1) * 500).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` });
            }
          }

          return (
            <div
              key={el.id}
              style={{ ...style, height: el.height, overflow: 'hidden' }}
              className={`${readOnly ? '' : 'border border-dashed border-primary/30'} ${selectedClass} ${hoverClass}`}
              onPointerDown={(e) => handlePointerDown(e, el, 'drag')}
              onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
            >
              {items.map((svc, idx) => {
                const svcLayout = getServiceLayout({
                  width: el.width,
                  height: itemHeight,
                  fontSize,
                  hasDescription: Boolean(svc.desc),
                  hasPrice: Boolean(showPrice && svc.price),
                });
                const isDimmed = variableValues?.[`service_${idx}_dimmed`] === '1';
                return (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: idx * itemHeight,
                      width: el.width,
                      height: itemHeight,
                      fontFamily: el.fontFamily || 'Space Grotesk',
                      background: bgOpacity < 1 ? `rgba(255,255,255,${bgOpacity * 0.1})` : undefined,
                      opacity: isDimmed ? 0.5 : 1,
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      left: svcLayout.name.left,
                      top: svcLayout.name.top,
                      width: svcLayout.name.width,
                      height: svcLayout.name.height,
                      fontSize,
                      fontWeight: '600',
                      color: textColor,
                      letterSpacing: '0.01em',
                      overflow: 'hidden',
                      lineHeight: `${svcLayout.name.lineHeightPx}px`,
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: svcLayout.name.maxLines,
                      wordBreak: 'break-word',
                    } as React.CSSProperties}>
                      {svc.name}
                    </div>
                    {svc.desc && svcLayout.description && (
                      <div style={{
                        position: 'absolute',
                        left: svcLayout.description.left,
                        top: svcLayout.description.top,
                        width: svcLayout.description.width,
                        height: svcLayout.description.height,
                        fontSize: svcLayout.description.fontSize,
                        color: '#6B7280',
                        overflow: 'hidden',
                        lineHeight: `${svcLayout.description.lineHeightPx}px`,
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: svcLayout.description.maxLines,
                        wordBreak: 'break-word',
                      } as React.CSSProperties}>
                        {svc.desc}
                      </div>
                    )}
                    {showPrice && svc.price && svcLayout.price && (
                      <div style={{
                        position: 'absolute',
                        left: svcLayout.price.left,
                        top: svcLayout.price.top,
                        width: svcLayout.price.width,
                        height: svcLayout.price.height,
                        fontSize,
                        fontWeight: '700',
                        color: textColor,
                        textAlign: 'right',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        letterSpacing: '-0.01em',
                        lineHeight: `${svcLayout.price.lineHeightPx}px`,
                      }}>
                        {svc.price}
                      </div>
                    )}
                    {bgOpacity >= 0.5 && idx < count - 1 && (
                      <div
                        style={{
                          position: 'absolute',
                          left: svcLayout.paddingX,
                          width: Math.max(el.width - svcLayout.paddingX * 2, 0),
                          bottom: 0,
                          height: 1,
                          backgroundColor: borderColor,
                        }}
                      />
                    )}
                  </div>
                );
              })}
              {resizeHandle}
            </div>
          );
        }

        case 'shape': {
          const variant = el.shapeVariant || 'square';
          const rotation = el.shapeRotation || 0;
          const lineThickness = variant === 'line' ? Math.max(el.shapeBorderWidth || 2, 1) : 0;
          const shapeStyle: React.CSSProperties = {
            position: 'absolute',
            left: el.x,
            top: el.y + (variant === 'line' ? (el.height / 2 - lineThickness / 2) : 0),
            width: el.width,
            height: variant === 'line' ? lineThickness : el.height,
            opacity: (el.shapeOpacity ?? 100) / 100,
            borderWidth: variant !== 'line' ? (el.shapeBorderWidth || 0) : 0,
            borderStyle: variant !== 'line' && (el.shapeBorderWidth || 0) > 0 ? 'solid' : 'none',
            borderColor: el.shapeBorderColor || '#000000',
            cursor: readOnly ? 'default' : (el.locked ? 'not-allowed' : 'grab'),
            userSelect: 'none',
            transform: rotation ? `rotate(${rotation}deg)` : undefined,
          };

          if (variant === 'circle') {
            shapeStyle.backgroundColor = el.shapeColor || '#3B82F6';
            shapeStyle.borderRadius = '50%';
          } else if (variant === 'line') {
            shapeStyle.backgroundColor = el.shapeColor || '#3B82F6';
            shapeStyle.borderRadius = lineThickness / 2;
          } else {
            shapeStyle.backgroundColor = el.shapeColor || '#3B82F6';
            shapeStyle.borderRadius = el.shapeBorderRadius || 0;
          }

          return (
            <div
              key={el.id}
              style={shapeStyle}
              className={`${selectedClass} ${hoverClass}`}
              onPointerDown={(e) => handlePointerDown(e, el, 'drag')}
              onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
            >
              {resizeHandle}
            </div>
          );
        }

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
        style={{ width: CANVAS_W, height: CANVAS_H, minWidth: CANVAS_W, minHeight: CANVAS_H, backgroundColor: backgroundColor || '#ffffff', overflow: clipOverflow || readOnly ? 'hidden' : 'visible' }}
        onPointerDown={handleCanvasPointerDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {elements.map((el, idx) => renderElement(el, idx))}

        {/* Alignment guide lines */}
        {guides.map((guide, i) => (
          <div
            key={`guide-${i}`}
            className="pointer-events-none absolute"
            style={
              guide.orientation === 'v'
                ? { left: guide.pos, top: 0, width: 1, height: CANVAS_H, backgroundColor: 'hsl(var(--primary))', opacity: 0.7, zIndex: 9999 }
                : { top: guide.pos, left: 0, height: 1, width: CANVAS_W, backgroundColor: 'hsl(var(--primary))', opacity: 0.7, zIndex: 9999 }
            }
          />
        ))}

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
