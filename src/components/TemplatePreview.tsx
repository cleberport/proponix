import { Template, CanvasElement, getTemplatePages } from '@/types/template';
import { useMemo } from 'react';

interface Props {
  template: Template;
  className?: string;
}

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
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill="#F1F5F9"
        stroke="#E2E8F0"
        strokeWidth={0.5}
      />
    );
  }

  if (type === 'table') {
    const rows = el.rows || [];
    const colWidths = el.columnWidths || [];
    const colCount = colWidths.length || 3;
    const rowH = 22;
    const headerH = 24;
    const totalH = Math.min(height, headerH + rows.length * rowH);

    return (
      <g>
        <rect x={x} y={y} width={width} height={headerH} rx={2} fill={el.color || '#F1F5F9'} />
        {/* Header col placeholders */}
        {Array.from({ length: colCount }).map((_, i) => {
          const colW = width / colCount;
          return (
            <rect
              key={i}
              x={x + i * colW + colW * 0.2}
              y={y + 8}
              width={colW * 0.6}
              height={8}
              rx={2}
              fill="rgba(255,255,255,0.4)"
            />
          );
        })}
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
        <rect x={x} y={y} width={width} height={totalH} rx={2} fill="none" stroke="#E2E8F0" strokeWidth={0.5} />
      </g>
    );
  }

  // Text types
  const fontSize = Math.max(6, Math.min(el.fontSize || 14, 28));
  const fontWeight = el.fontWeight || '400';
  const color = el.color || '#0F172A';
  const align = el.alignment || 'left';
  const content = el.content || el.variable || '';

  const displayText = type === 'dynamic-field'
    ? (el.content || el.variable || '{{campo}}')
    : content;

  const textAnchor = align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';
  const tx = align === 'center' ? x + width / 2 : align === 'right' ? x + width : x;

  return (
    <text
      x={tx}
      y={y + fontSize * 0.85}
      textAnchor={textAnchor}
      fontSize={fontSize}
      fontWeight={fontWeight}
      fontFamily={el.fontFamily || 'Inter, sans-serif'}
      fill={color}
    >
      {displayText.substring(0, 60)}
    </text>
  );
}

export default TemplatePreview;
