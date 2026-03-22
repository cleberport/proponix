import { Template, CanvasElement, getTemplatePages } from '@/types/template';
import { useMemo } from 'react';

interface Props {
  template: Template;
  className?: string;
}

/**
 * Renders a scaled-down visual preview of a template's first page,
 * mimicking the actual PDF layout. All coordinates are proportionally
 * mapped from the 595×842 canvas to the rendered size.
 */
const TemplatePreview = ({ template, className = '' }: Props) => {
  const pages = getTemplatePages(template);
  const elements = pages[0] || [];
  const cw = template.canvasWidth || 595;
  const ch = template.canvasHeight || 842;
  const bgColor = template.settings?.backgroundColor || '#FFFFFF';

  const sorted = useMemo(
    () => [...elements].filter(e => e.isVisible !== false).sort((a, b) => (a.y - b.y || a.x - b.x)),
    [elements],
  );

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: `${cw} / ${ch}`, backgroundColor: bgColor }}
    >
      {/* Scale container: viewBox-like approach */}
      <svg
        viewBox={`0 0 ${cw} ${ch}`}
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {sorted.map((el) => (
          <ElementPreview key={el.id} el={el} />
        ))}
      </svg>
    </div>
  );
};

function ElementPreview({ el }: { el: CanvasElement }) {
  const { x, y, width, height, type } = el;

  if (type === 'divider') {
    return (
      <line
        x1={x}
        y1={y}
        x2={x + width}
        y2={y}
        stroke={el.color || '#E4E4E7'}
        strokeWidth={Math.max(1, height)}
      />
    );
  }

  if (type === 'image' || type === 'logo') {
    // Render as a colored rect placeholder
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={el.backgroundColor || '#F1F5F9'}
        stroke="#E2E8F0"
        strokeWidth={0.5}
      />
    );
  }

  if (type === 'table') {
    const cols = el.columns || [];
    const rows = el.tableData || [];
    const colCount = cols.length || 3;
    const rowH = 22;
    const headerH = 24;
    const totalH = Math.min(height, headerH + rows.length * rowH);

    return (
      <g>
        {/* Header bg */}
        <rect x={x} y={y} width={width} height={headerH} rx={2} fill={el.color || '#F1F5F9'} />
        {/* Header text placeholders */}
        {cols.map((col, i) => {
          const colW = width / colCount;
          return (
            <text
              key={i}
              x={x + i * colW + colW / 2}
              y={y + headerH / 2 + 3}
              textAnchor="middle"
              fontSize={7}
              fontWeight="600"
              fill={el.color === '#FFFFFF' || el.color === '#ffffff' ? '#FFFFFF' : '#475569'}
              fontFamily="Inter, sans-serif"
            >
              {col.title?.substring(0, 12) || ''}
            </text>
          );
        })}
        {/* Row lines */}
        {rows.slice(0, 5).map((_, i) => (
          <line
            key={i}
            x1={x}
            y1={y + headerH + (i + 1) * rowH}
            x2={x + width}
            y2={y + headerH + (i + 1) * rowH}
            stroke="#F1F5F9"
            strokeWidth={0.5}
          />
        ))}
        {/* Border */}
        <rect x={x} y={y} width={width} height={totalH} rx={2} fill="none" stroke="#E2E8F0" strokeWidth={0.5} />
      </g>
    );
  }

  // Text / dynamic-field / price-field / total-calculation / notes
  const fontSize = Math.max(6, Math.min(el.fontSize || 14, 28));
  const fontWeight = el.fontWeight || '400';
  const color = el.color || '#0F172A';
  const align = el.alignment || 'left';
  const content = el.content || el.variable || '';

  // For dynamic fields, show the variable name as placeholder
  const displayText = type === 'dynamic-field'
    ? (el.content || el.variable || '{{campo}}')
    : content;

  const textAnchor = align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';
  const tx = align === 'center' ? x + width / 2 : align === 'right' ? x + width : x;

  // Background rect for elements that have one
  const bg = el.backgroundColor;

  return (
    <g>
      {bg && (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={el.borderRadius || 0}
          fill={bg}
        />
      )}
      <text
        x={tx}
        y={y + fontSize * 0.85}
        textAnchor={textAnchor}
        fontSize={fontSize}
        fontWeight={fontWeight}
        fontFamily={el.fontFamily || 'Inter, sans-serif'}
        fill={color}
        clipPath={`rect(${y}px, ${x + width}px, ${y + height}px, ${x}px)`}
      >
        {displayText.substring(0, 60)}
      </text>
    </g>
  );
}

export default TemplatePreview;
