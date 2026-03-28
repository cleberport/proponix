import { forwardRef, useCallback, useState, useRef, useEffect } from 'react';
import { CanvasElement } from '@/types/template';
import { v4 as uuidv4 } from 'uuid';
import { optimizeImageFile } from '@/lib/imageOptimization';
import { resolveTextColor, isDark } from '@/lib/colorContrast';

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
const SNAP_THRESHOLD = 5;

const snap = (v: number) => Math.round(v / GRID) * GRID;

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
  ({ elements, selectedId, selectedIds = [], onSelect, onMultiSelect, onUpdate, onAddElement, readOnly, variableValues, showGrid = true, backgroundColor }, ref) => {
    const [dragging, setDragging] = useState<string | null>(null);
    const [resizing, setResizing] = useState<string | null>(null);
    const [editingImageId, setEditingImageId] = useState<string | null>(null);
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
        if (editingImageId !== el.id) setEditingImageId(null);
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
                  x: snap(Math.max(0, item.x + dx)),
                  y: snap(Math.max(0, item.y + dy)),
                });
              });
              setGuides([]);
            } else {
              const maxX = Math.max(0, CANVAS_W - el.width);
              const maxY = Math.max(0, CANVAS_H - el.height);
              let newX = Math.max(0, Math.min(maxX, startPos.current.elX + dx));
              let newY = Math.max(0, Math.min(maxY, startPos.current.elY + dy));

              // Compute snap against other elements
              const others = elementsRef.current.filter(e => e.id !== el.id);
              const snapResult = computeElementSnap(
                { x: newX, y: newY, width: el.width, height: el.height },
                others,
              );

              if (snapResult.x !== null) newX = Math.max(0, Math.min(maxX, snapResult.x));
              else newX = snap(newX);

              if (snapResult.y !== null) newY = Math.max(0, Math.min(maxY, snapResult.y));
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
      [onSelect, onUpdate, readOnly, selectedIds, editingImageId]
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

    const renderElement = (el: CanvasElement) => {
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
        color: resolveTextColor(el.color, backgroundColor),
        textAlign: el.alignment,
        cursor: readOnly ? 'default' : (editingTextId === el.id ? 'text' : 'grab'),
        userSelect: editingTextId === el.id ? 'text' : 'none',
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
          const varValue = resolveVariable(el);
          // In readOnly, hide the entire element label when variable has no value
          const showContent = el.content && (!readOnly || varValue);
          return (
            <div
              key={el.id}
              style={style}
              className={`flex items-center gap-1 rounded px-1 ${selectedClass} ${hoverClass}`}
              onPointerDown={(e) => handlePointerDown(e, el, 'drag')}
              onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
            >
              {showContent && <span>{resolveContent(el)}</span>}
              <span className={`${readOnly ? '' : 'rounded bg-primary/10 px-1.5 py-0.5 font-mono'}`} style={readOnly ? {} : { color: resolveTextColor(el.color, backgroundColor) || 'hsl(var(--primary))' }}>
                {varValue}
              </span>
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

          const isFraming = editingImageId === el.id;
          const scale = el.imageScale || 1;
          const offsetX = el.imageOffsetX || 0;
          const offsetY = el.imageOffsetY || 0;

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
            cursor: el.locked ? 'not-allowed' : (isFraming ? 'grab' : (readOnly ? 'default' : 'grab')),
          };

          const isLogoEl = el.type === 'logo';
          // Auto-invert logo on dark backgrounds
          const logoDarkBg = isLogoEl && isDark(backgroundColor);
          const logoFilter = logoDarkBg ? 'brightness(0) invert(1)' : undefined;
          const combinedFilter = isLogoEl
            ? logoFilter
            : filterStr;

          const imgInnerStyle: React.CSSProperties = {
            filter: combinedFilter,
            position: isLogoEl ? 'relative' as const : 'absolute' as const,
            top: isLogoEl ? undefined : 0,
            left: isLogoEl ? undefined : 0,
            width: isLogoEl ? '100%' : `${scale * 100}%`,
            height: isLogoEl ? '100%' : `${scale * 100}%`,
            objectFit: isLogoEl ? 'contain' : 'cover',
            objectPosition: 'center',
            transform: isLogoEl ? undefined : `translate(${offsetX}px, ${offsetY}px)`,
            pointerEvents: 'none',
          };

          if (hasCrop) {
            imgInnerStyle.clipPath = `inset(${cropY}% ${100 - cropX - cropW}% ${100 - cropY - cropH}% ${cropX}%)`;
          }

          return (
            <div
              key={el.id}
              style={imgContainerStyle}
              className={`relative ${el.imageUrl ? '' : 'border border-dashed border-border bg-accent/30'} ${selectedClass} ${hoverClass} ${isFraming ? 'ring-2 ring-blue-500' : ''}`}
              onPointerDown={(e) => {
                if (isFraming) {
                  handleImagePanPointerDown(e, el);
                  return;
                }
                handlePointerDown(e, el, 'drag');
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (!readOnly && !el.locked && el.imageUrl) {
                  const entering = editingImageId !== el.id;
                  setEditingImageId(entering ? el.id : null);
                  if (entering && (el.imageScale || 1) <= 1) {
                    onUpdate(el.id, { imageScale: 1.2 });
                  }
                  onSelect(el.id);
                }
              }}
              onWheel={(e) => {
                if (!isFraming || el.locked) return;
                e.stopPropagation();
                const delta = e.deltaY > 0 ? -0.05 : 0.05;
                const newScale = Math.max(1, Math.min(3, (el.imageScale || 1) + delta));
                onUpdate(el.id, { imageScale: newScale });
              }}
              onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
            >
              {el.imageUrl ? (
                <img
                  src={el.imageUrl}
                  alt={el.type === 'logo' ? 'Logo' : 'Imagem'}
                  style={imgInnerStyle}
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
              {el.locked && elSelected && (
                <div className="absolute top-1 left-1 rounded bg-card/80 p-0.5 z-10">
                  <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
              )}
              {isFraming && !el.locked && (
                <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-foreground/80 px-3 py-1 text-[10px] text-background font-medium z-10">
                  Arraste para enquadrar · Scroll para zoom
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
                      {row.cells.map((rawCell, ci) => {
                        const cell = typeof rawCell === 'object' && rawCell !== null ? (rawCell as any).content ?? '' : String(rawCell ?? '');
                        return (
                        <td
                          key={ci}
                          className="px-2 py-1.5"
                          style={{
                            borderBottom: '1px solid hsl(240 5% 82%)',
                            borderRight: ci < row.cells.length - 1 ? '1px solid hsl(240 5% 82%)' : 'none',
                            color: resolveTextColor(el.color, backgroundColor),
                          }}
                        >
                          {variableValues ? resolveContent({ ...el, content: cell }) : (cell || (ri > 0 ? '\u00A0' : ''))}
                        </td>
                        );
                      })}
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
