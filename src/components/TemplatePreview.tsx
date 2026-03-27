import { useEffect, useMemo, useRef, useState } from 'react';
import CanvasRenderer from '@/components/editor/CanvasRenderer';
import { resolveAllValues } from '@/lib/calculations';
import { Template, getTemplatePages } from '@/types/template';
import { getSettings } from '@/lib/templateStorage';

interface Props {
  template: Template;
  className?: string;
}

const NOOP = () => undefined;

const TemplatePreview = ({ template, className = '' }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const canvasWidth = template.canvasWidth || 595;
  const canvasHeight = template.canvasHeight || 842;

  const firstPageElements = useMemo(() => {
    const page = getTemplatePages(template)[0] ?? [];
    const s = getSettings();
    if (s.logoUrl) {
      const ar = s.logoAspectRatio || 1;
      return page.map(el => {
        if (el.type === 'logo' && !el.imageUrl) {
          return { ...el, imageUrl: s.logoUrl, objectFit: 'contain' as const, height: Math.round(el.width / ar) };
        }
        return el;
      });
    }
    return page;
  }, [template]);
  const resolvedValues = useMemo(() => resolveAllValues(template, {}), [template]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => setContainerWidth(node.clientWidth || 0);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const scale = containerWidth > 0 ? containerWidth / canvasWidth : 1;

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${className}`}
      style={{ aspectRatio: `${canvasWidth} / ${canvasHeight}` }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <div
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <CanvasRenderer
            elements={firstPageElements}
            selectedId={null}
            onSelect={NOOP}
            onUpdate={NOOP}
            readOnly
            variableValues={resolvedValues}
            showGrid={false}
            backgroundColor={template.settings?.backgroundColor}
          />
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;
