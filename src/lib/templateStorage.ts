import { CanvasElement, Template, SavedTemplate, TemplateSettings, getTemplatePages } from '@/types/template';
import { starterTemplates } from '@/data/templates';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'budget-template-builder-templates';
const SETTINGS_KEY = 'budget-template-builder-settings';
const HISTORY_KEY = 'budget-template-builder-history';
const PDF_COUNTER_KEY = 'budget-template-builder-pdf-counter';
const HIDDEN_STARTERS_KEY = 'budget-template-builder-hidden-starters';

const db = supabase as any;

interface CustomTemplateRow {
  id: string;
  user_id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  color: string | null;
  elements: unknown;
  variables: unknown;
  canvas_width: number;
  canvas_height: number;
  default_values: unknown;
  input_fields: unknown;
  calculated_fields: unknown;
  settings: unknown;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  profileName: string;
  companyName: string;
  companyCnpj: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite: string;
  companyAddress: string;
  defaultTaxRate: number;
  logoUrl: string;
  logoWidth?: number;
  logoHeight?: number;
  logoAspectRatio?: number;
  theme: 'light' | 'dark';
  pdfBaseName: string;
  defaultTemplateId: string;
}

export interface GeneratedDocument {
  id: string;
  templateId: string;
  templateName: string;
  clientName: string;
  fileName: string;
  generatedAt: string;
  values: Record<string, string>;
}

const DEFAULT_SETTINGS: AppSettings = {
  profileName: '',
  companyName: '',
  companyCnpj: '',
  companyEmail: '',
  companyPhone: '',
  companyWebsite: '',
  companyAddress: '',
  defaultTaxRate: 0.10,
  logoUrl: '',
  theme: 'light',
  pdfBaseName: 'Proposta',
  defaultTemplateId: '',
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
};

const toStringRecord = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, String(v ?? '')]));
};

const toTemplateSettings = (value: unknown): TemplateSettings => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { taxRate: 0.10, showTax: true };
  }

  const settings = value as { taxRate?: unknown; showTax?: unknown };
  const taxRate = typeof settings.taxRate === 'number' ? settings.taxRate : parseFloat(String(settings.taxRate ?? '0.10'));
  const showTax = typeof settings.showTax === 'boolean' ? settings.showTax : String(settings.showTax ?? 'true') === 'true';

  return {
    taxRate: Number.isFinite(taxRate) ? taxRate : 0.10,
    showTax,
  };
};

const toCanvasElements = (value: unknown): CanvasElement[] => {
  if (!Array.isArray(value)) return [];
  return value as CanvasElement[];
};

const toCanvasPages = (value: unknown): CanvasElement[][] => {
  if (!Array.isArray(value)) return [];
  return value.filter((page): page is CanvasElement[] => Array.isArray(page));
};

const toTemplateLayout = (value: unknown): { elements: CanvasElement[]; pages?: CanvasElement[][] } => {
  if (Array.isArray(value)) {
    return { elements: toCanvasElements(value) };
  }

  if (!value || typeof value !== 'object') {
    return { elements: [] };
  }

  const payload = value as { elements?: unknown; pages?: unknown };
  const pages = toCanvasPages(payload.pages);
  const elements = toCanvasElements(payload.elements);

  if (pages.length > 0) {
    return {
      elements: elements.length > 0 ? elements : (pages[0] || []),
      pages,
    };
  }

  return { elements };
};

const getCachedSavedTemplates = (): SavedTemplate[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
};

const setCachedSavedTemplates = (templates: SavedTemplate[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
};

const sortByUpdatedAtDesc = (templates: SavedTemplate[]) => {
  return [...templates].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

const mapRowToSavedTemplate = (row: CustomTemplateRow): SavedTemplate => {
  const layout = toTemplateLayout(row.elements);

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    thumbnail: row.thumbnail,
    color: row.color || undefined,
    elements: layout.elements,
    pages: layout.pages,
    variables: toStringArray(row.variables),
    canvasWidth: row.canvas_width,
    canvasHeight: row.canvas_height,
    defaultValues: toStringRecord(row.default_values),
    inputFields: toStringArray(row.input_fields),
    calculatedFields: toStringRecord(row.calculated_fields),
    settings: toTemplateSettings(row.settings),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapTemplateToDb = (template: SavedTemplate, userId: string) => {
  const pages = getTemplatePages(template);

  return {
    id: template.id,
    user_id: userId,
    name: template.name,
    category: template.category,
    description: template.description,
    thumbnail: template.thumbnail || '',
    color: template.color || null,
    elements: {
      elements: pages[0] || [],
      pages,
    },
    variables: template.variables,
    canvas_width: template.canvasWidth,
    canvas_height: template.canvasHeight,
    default_values: template.defaultValues || {},
    input_fields: template.inputFields || [],
    calculated_fields: template.calculatedFields || {},
    settings: template.settings || { taxRate: 0.10, showTax: true },
    created_at: template.createdAt,
    updated_at: template.updatedAt,
  };
};

const getCurrentUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
};

const mergeIntoCache = (template: SavedTemplate) => {
  const all = getCachedSavedTemplates();
  const idx = all.findIndex((t) => t.id === template.id);
  if (idx >= 0) all[idx] = template;
  else all.push(template);
  setCachedSavedTemplates(sortByUpdatedAtDesc(all));
};

export function getSettings(): AppSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getHiddenStarterIds(): string[] {
  const raw = localStorage.getItem(HIDDEN_STARTERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function hideStarterTemplate(id: string): void {
  const hidden = getHiddenStarterIds();
  if (!hidden.includes(id)) {
    hidden.push(id);
    localStorage.setItem(HIDDEN_STARTERS_KEY, JSON.stringify(hidden));
  }
}

export function hideAllStarterTemplates(): void {
  const ids = starterTemplates.map((t) => t.id);
  localStorage.setItem(HIDDEN_STARTERS_KEY, JSON.stringify(ids));
}

export function getStarterTemplates(): Template[] {
  const hidden = getHiddenStarterIds();
  return starterTemplates.filter((t) => !hidden.includes(t.id));
}

export async function getSavedTemplates(): Promise<SavedTemplate[]> {
  const cached = getCachedSavedTemplates();
  const userId = await getCurrentUserId();
  if (!userId) return cached;

  const { data, error } = await db
    .from('custom_templates')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar templates do backend:', error);
    return cached;
  }

  const remote = (data as CustomTemplateRow[] | null)?.map(mapRowToSavedTemplate) || [];
  const remoteIds = new Set(remote.map((template) => template.id));
  const missingFromRemote = cached.filter((template) => !remoteIds.has(template.id));

  if (missingFromRemote.length > 0) {
    const { error: syncError } = await db
      .from('custom_templates')
      .upsert(missingFromRemote.map((template) => mapTemplateToDb(template, userId)), { onConflict: 'id' });

    if (syncError) {
      console.error('Erro ao sincronizar templates locais:', syncError);
    }
  }

  const merged = sortByUpdatedAtDesc([...remote, ...missingFromRemote.filter((template) => !remoteIds.has(template.id))]);
  setCachedSavedTemplates(merged);
  return merged;
}

export async function saveTemplate(template: Template): Promise<SavedTemplate> {
  const cached = getCachedSavedTemplates();
  const existing = cached.find((t) => t.id === template.id);
  const now = new Date().toISOString();

  const saved: SavedTemplate = {
    ...template,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  // Always persist to localStorage first as safety net
  mergeIntoCache(saved);

  const userId = await getCurrentUserId();
  if (!userId) {
    return saved;
  }

  try {
    const { data, error } = await db
      .from('custom_templates')
      .upsert(mapTemplateToDb(saved, userId), { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao salvar template no backend:', error);
      return saved;
    }

    const mapped = mapRowToSavedTemplate(data as CustomTemplateRow);
    mergeIntoCache(mapped);
    return mapped;
  } catch (err) {
    console.error('Erro inesperado ao salvar template:', err);
    return saved;
  }
}

export async function duplicateTemplate(id: string): Promise<SavedTemplate | null> {
  const original = await getTemplateById(id);
  if (!original) return null;

  const copy: Template = {
    ...original,
    id: crypto.randomUUID(),
    name: `${original.name} (Cópia)`,
  };

  return saveTemplate(copy);
}

export async function deleteTemplate(id: string): Promise<void> {
  const updatedLocal = getCachedSavedTemplates().filter((t) => t.id !== id);
  setCachedSavedTemplates(updatedLocal);

  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error } = await db
    .from('custom_templates')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao excluir template no backend:', error);
  }
}

export function restoreDefaultTemplates(): void {
  const saved = getCachedSavedTemplates();
  const starterIds = starterTemplates.map((t) => t.id);
  const filtered = saved.filter((t) => !starterIds.includes(t.id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  localStorage.removeItem(HIDDEN_STARTERS_KEY);
}

export async function getTemplateById(id: string): Promise<Template | undefined> {
  const cached = getCachedSavedTemplates();
  const saved = cached.find((template) => template.id === id);
  if (saved) return saved;

  const userId = await getCurrentUserId();
  if (userId) {
    const { data, error } = await db
      .from('custom_templates')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      const mapped = mapRowToSavedTemplate(data as CustomTemplateRow);
      mergeIntoCache(mapped);
      return mapped;
    }
  }

  return starterTemplates.find((template) => template.id === id);
}

// Document history
export function getDocumentHistory(): GeneratedDocument[] {
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function addDocumentToHistory(doc: GeneratedDocument): void {
  const history = getDocumentHistory();
  history.unshift(doc);
  if (history.length > 100) history.length = 100;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function deleteDocumentFromHistory(id: string): void {
  const history = getDocumentHistory().filter((d) => d.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function getDocumentById(id: string): GeneratedDocument | undefined {
  return getDocumentHistory().find((d) => d.id === id);
}

// PDF counter for sequential naming
export function getNextPdfNumber(): number {
  const raw = localStorage.getItem(PDF_COUNTER_KEY);
  const current = raw ? parseInt(raw, 10) : 0;
  const next = current + 1;
  localStorage.setItem(PDF_COUNTER_KEY, String(next));
  return next;
}

export function generatePdfFileName(): string {
  const settings = getSettings();
  const baseName = settings.pdfBaseName || 'Proposta';
  const num = getNextPdfNumber();
  return `${baseName} ${String(num).padStart(3, '0')}.pdf`;
}
