import { useEffect, useMemo, useRef, useState } from 'react';
import CanvasRenderer from '@/components/editor/CanvasRenderer';
import { resolveAllValues } from '@/lib/calculations';
import { Template, getTemplatePages } from '@/types/template';
import { getSettings, AppSettings } from '@/lib/templateStorage';

interface Props {
  template: Template;
  className?: string;
}

const NOOP = () => undefined;

const TemplatePreview = ({ template, className = '' }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());

  // Re-read settings whenever component mounts or becomes visible
  useEffect(() => {
    const refresh = () => setSettings(getSettings());
    // Listen for storage changes (settings saved in another component)
    window.addEventListener('storage', refresh);
    // Also poll on focus to catch same-tab saves
    window.addEventListener('focus', refresh);
    // Listen for custom event dispatched when settings are saved
    window.addEventListener('settings-updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('settings-updated', refresh);
    };
  }, []);

  const canvasWidth = template.canvasWidth || 595;
  const canvasHeight = template.canvasHeight || 842;

  const isStarterTemplate = !template.id || template.id.startsWith('template-');

  const firstPageElements = useMemo(() => {
    const page = getTemplatePages(template)[0] ?? [];
    if (!isStarterTemplate) return page;

    const ar = settings.logoAspectRatio || 1;
    return page.map(el => {
      if (el.type === 'logo') {
        if (s.logoUrl) {
          const origW = el.width;
          const origH = el.height;
          let fitW = origW;
          let fitH = Math.round(fitW / ar);
          if (fitH > origH) {
            fitH = origH;
            fitW = Math.round(fitH * ar);
          }
          return { ...el, imageUrl: s.logoUrl, objectFit: 'contain' as const, width: fitW, height: fitH };
        }
        // No logo in settings → clear any old logo so placeholder shows
        return { ...el, imageUrl: undefined };
      }
      return el;
    });
  }, [template, isStarterTemplate]);
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
