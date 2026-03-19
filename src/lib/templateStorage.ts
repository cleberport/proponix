import { CanvasElement, Template, SavedTemplate, TemplateSettings, getTemplatePages } from '@/types/template';
import { starterTemplates } from '@/data/templates';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'budget-template-builder-templates';
const SETTINGS_KEY = 'budget-template-builder-settings';
const HISTORY_KEY = 'budget-template-builder-history';
const PDF_COUNTER_KEY = 'budget-template-builder-pdf-counter';
const HIDDEN_STARTERS_KEY = 'budget-template-builder-hidden-starters';
const LEGACY_TEMPLATE_ID_MAP_KEY = 'budget-template-builder-legacy-template-id-map';

const db = supabase as any;

let savedTemplatesSyncPromise: Promise<SavedTemplate[]> | null = null;
let documentHistorySyncPromise: Promise<GeneratedDocument[]> | null = null;
let authUserIdHint: string | null = null;

export const setAuthUserIdHint = (userId: string | null) => {
  authUserIdHint = userId;
};

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

interface GeneratedDocumentRow {
  id: string;
  user_id: string;
  template_id: string;
  template_name: string;
  client_name: string;
  file_name: string;
  generated_at: string;
  values: unknown;
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

  const settings = value as { taxRate?: unknown; showTax?: unknown; backgroundColor?: unknown };
  const taxRate = typeof settings.taxRate === 'number' ? settings.taxRate : parseFloat(String(settings.taxRate ?? '0.10'));
  const showTax = typeof settings.showTax === 'boolean' ? settings.showTax : String(settings.showTax ?? 'true') === 'true';
  const backgroundColor = typeof settings.backgroundColor === 'string' ? settings.backgroundColor : undefined;

  return {
    taxRate: Number.isFinite(taxRate) ? taxRate : 0.10,
    showTax,
    ...(backgroundColor ? { backgroundColor } : {}),
  };
};

const isUuid = (value: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

const getLegacyTemplateIdMap = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(LEGACY_TEMPLATE_ID_MAP_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        ([legacyId, mappedId]) => typeof legacyId === 'string' && typeof mappedId === 'string' && isUuid(mappedId)
      )
    ) as Record<string, string>;
  } catch {
    return {};
  }
};

const setLegacyTemplateIdMap = (map: Record<string, string>) => {
  localStorage.setItem(LEGACY_TEMPLATE_ID_MAP_KEY, JSON.stringify(map));
};

const remapLocalHistoryTemplateIds = (legacyMap: Record<string, string>) => {
  if (Object.keys(legacyMap).length === 0) return;

  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    let changed = false;
    const remapped = parsed.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const doc = item as GeneratedDocument;
      const mappedTemplateId = legacyMap[doc.templateId];
      if (!mappedTemplateId || mappedTemplateId === doc.templateId) return doc;
      changed = true;
      return { ...doc, templateId: mappedTemplateId };
    });

    if (changed) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(remapped));
    }
  } catch {
    // ignore malformed local cache
  }
};

const normalizeSavedTemplates = (templates: SavedTemplate[]): SavedTemplate[] => {
  const existingMap = getLegacyTemplateIdMap();
  const nextMap = { ...existingMap };
  let templatesChanged = false;

  const normalized = templates.map((template) => {
    if (isUuid(template.id)) return template;

    const mappedId = nextMap[template.id] ?? crypto.randomUUID();
    if (!nextMap[template.id]) {
      nextMap[template.id] = mappedId;
    }

    templatesChanged = true;
    const now = new Date().toISOString();

    return {
      ...template,
      id: mappedId,
      createdAt: template.createdAt || now,
      updatedAt: template.updatedAt || now,
    };
  });

  const mapChanged = JSON.stringify(existingMap) !== JSON.stringify(nextMap);
  if (mapChanged) {
    setLegacyTemplateIdMap(nextMap);
    remapLocalHistoryTemplateIds(nextMap);
  }

  return templatesChanged ? normalized : templates;
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
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const templates = Array.isArray(parsed) ? (parsed as SavedTemplate[]) : [];
    const normalized = normalizeSavedTemplates(templates);

    if (normalized !== templates) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }

    return normalized;
  } catch (error) {
    console.warn('Cache local de templates inválido. Limpando armazenamento local.', error);
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
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

const mapDocumentToDb = (doc: GeneratedDocument, userId: string) => ({
  id: doc.id,
  user_id: userId,
  template_id: doc.templateId,
  template_name: doc.templateName,
  client_name: doc.clientName || '',
  file_name: doc.fileName,
  generated_at: doc.generatedAt,
  values: doc.values || {},
});

const mapRowToGeneratedDocument = (row: GeneratedDocumentRow): GeneratedDocument => ({
  id: row.id,
  templateId: row.template_id,
  templateName: row.template_name,
  clientName: row.client_name,
  fileName: row.file_name,
  generatedAt: row.generated_at,
  values: toStringRecord(row.values),
});

const getCurrentUserId = async (): Promise<string | null> => {
  if (authUserIdHint) return authUserIdHint;

  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUserId = sessionData.session?.user?.id;
  if (sessionUserId) {
    authUserIdHint = sessionUserId;
    return sessionUserId;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.warn('Não foi possível validar usuário autenticado:', error.message);
  }

  const fallbackUserId = data.user?.id ?? null;
  if (fallbackUserId) {
    authUserIdHint = fallbackUserId;
  }

  return fallbackUserId;
};

const resolveCurrentUserId = async (): Promise<string | null> => {
  const immediateUserId = await getCurrentUserId();
  if (immediateUserId) return immediateUserId;

  await new Promise((resolve) => setTimeout(resolve, 300));
  return getCurrentUserId();
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
  // Fire-and-forget sync to server
  void syncSettingsToServer(settings);
}

export async function loadSettingsFromServer(): Promise<AppSettings> {
  const local = getSettings();
  const userId = await resolveCurrentUserId();
  if (!userId) return local;

  const { data, error } = await db
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return local;

  const remote: AppSettings = {
    profileName: data.profile_name ?? '',
    companyName: data.company_name ?? '',
    companyCnpj: data.company_cnpj ?? '',
    companyEmail: data.company_email ?? '',
    companyPhone: data.company_phone ?? '',
    companyWebsite: data.company_website ?? '',
    companyAddress: data.company_address ?? '',
    defaultTaxRate: Number(data.default_tax_rate) || 0.10,
    logoUrl: data.logo_url ?? '',
    logoWidth: data.logo_width ?? undefined,
    logoHeight: data.logo_height ?? undefined,
    logoAspectRatio: data.logo_aspect_ratio ? Number(data.logo_aspect_ratio) : undefined,
    theme: (data.theme === 'dark' ? 'dark' : 'light'),
    pdfBaseName: data.pdf_base_name ?? 'Proposta',
    defaultTemplateId: data.default_template_id ?? '',
  };

  // Update local cache with server data
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(remote));
  return remote;
}

async function syncSettingsToServer(settings: AppSettings): Promise<void> {
  const userId = await resolveCurrentUserId();
  if (!userId) return;

  const row = {
    user_id: userId,
    profile_name: settings.profileName,
    company_name: settings.companyName,
    company_cnpj: settings.companyCnpj,
    company_email: settings.companyEmail,
    company_phone: settings.companyPhone,
    company_website: settings.companyWebsite,
    company_address: settings.companyAddress,
    default_tax_rate: settings.defaultTaxRate,
    logo_url: settings.logoUrl,
    logo_width: settings.logoWidth ?? null,
    logo_height: settings.logoHeight ?? null,
    logo_aspect_ratio: settings.logoAspectRatio ?? null,
    theme: settings.theme,
    pdf_base_name: settings.pdfBaseName,
    default_template_id: settings.defaultTemplateId,
  };

  const { error } = await db
    .from('user_settings')
    .upsert(row, { onConflict: 'user_id' });

  if (error) {
    console.error('Erro ao salvar configurações no servidor:', error);
  }
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

const fetchRemoteSavedTemplates = async (userId: string): Promise<SavedTemplate[] | null> => {
  const { data, error } = await db
    .from('custom_templates')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar templates do backend:', error);
    return null;
  }

  return (data as CustomTemplateRow[] | null)?.map(mapRowToSavedTemplate) || [];
};

export async function getSavedTemplates(): Promise<SavedTemplate[]> {
  if (savedTemplatesSyncPromise) return savedTemplatesSyncPromise;

  savedTemplatesSyncPromise = (async () => {
    const cached = getCachedSavedTemplates();
    const userId = await resolveCurrentUserId();
    if (!userId) return cached;

    const remote = await fetchRemoteSavedTemplates(userId);
    if (!remote) return cached;

    const remoteIds = new Set(remote.map((template) => template.id));
    const localOnly = cached.filter((template) => !remoteIds.has(template.id) && isUuid(template.id));

    if (localOnly.length > 0) {
      const { error: syncError } = await db
        .from('custom_templates')
        .upsert(localOnly.map((template) => mapTemplateToDb(template, userId)), { onConflict: 'id' });

      if (syncError) {
        console.error('Erro ao sincronizar templates locais:', syncError);
      }
    }

    const reconciled = localOnly.length > 0
      ? (await fetchRemoteSavedTemplates(userId)) ?? remote
      : remote;

    setCachedSavedTemplates(reconciled);
    return reconciled;
  })();

  try {
    return await savedTemplatesSyncPromise;
  } finally {
    savedTemplatesSyncPromise = null;
  }
}

export async function saveTemplate(template: Template): Promise<SavedTemplate> {
  const cached = getCachedSavedTemplates();
  const finalId = isUuid(template.id) ? template.id : crypto.randomUUID();
  const existing = cached.find((t) => t.id === finalId);
  const now = new Date().toISOString();

  const saved: SavedTemplate = {
    ...template,
    id: finalId,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  let localPersisted = false;
  try {
    // safety net: local cache first, but never break save flow if storage is full
    mergeIntoCache(saved);
    localPersisted = true;
  } catch (cacheError) {
    console.warn('Não foi possível salvar em cache local:', cacheError);
  }

  const userId = await resolveCurrentUserId();
  if (!userId) {
    if (!localPersisted) {
      throw new Error('Falha ao salvar localmente. Reduza o tamanho da imagem e tente novamente.');
    }
    return saved;
  }

  try {
    const { error } = await db
      .from('custom_templates')
      .upsert(mapTemplateToDb(saved, userId), { onConflict: 'id' });

    if (error) {
      console.error('Erro ao salvar template no backend:', error);
      if (!localPersisted) {
        throw new Error(error.message || 'Falha ao salvar template no backend');
      }
      return saved;
    }

    return saved;
  } catch (err) {
    console.error('Erro inesperado ao salvar template:', err);
    if (!localPersisted) {
      throw err instanceof Error ? err : new Error('Falha ao salvar template');
    }
    return saved;
  }
}

export async function duplicateTemplate(id: string): Promise<SavedTemplate | null> {
  const original = await getTemplateById(id);
  if (!original) {
    console.error('duplicateTemplate: template não encontrado', id);
    return null;
  }

  const source = typeof structuredClone === 'function'
    ? structuredClone(original)
    : JSON.parse(JSON.stringify(original)) as Template;

  const copy: Template = {
    ...source,
    id: crypto.randomUUID(),
    name: `${source.name} (Cópia)`,
  };

  return saveTemplate(copy);
}

export async function deleteTemplate(id: string): Promise<void> {
  const previousLocal = getCachedSavedTemplates();
  const updatedLocal = previousLocal.filter((t) => t.id !== id);
  setCachedSavedTemplates(updatedLocal);

  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error } = await db
    .from('custom_templates')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    setCachedSavedTemplates(previousLocal);
    console.error('Erro ao excluir template no backend:', error);
    throw error;
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
  const legacyMap = getLegacyTemplateIdMap();
  const resolvedId = legacyMap[id] ?? id;

  const saved = cached.find((template) => template.id === resolvedId);
  if (saved) return saved;

  if (!isUuid(resolvedId)) {
    return starterTemplates.find((template) => template.id === id || template.id === resolvedId);
  }

  const userId = await getCurrentUserId();
  if (userId) {
    const { data, error } = await db
      .from('custom_templates')
      .select('*')
      .eq('id', resolvedId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      const mapped = mapRowToSavedTemplate(data as CustomTemplateRow);
      mergeIntoCache(mapped);
      return mapped;
    }
  }

  return starterTemplates.find((template) => template.id === id || template.id === resolvedId);
}

// Document history
const sortDocumentHistory = (history: GeneratedDocument[]) => {
  return [...history].sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
};

const normalizeDocumentId = (doc: GeneratedDocument): GeneratedDocument => {
  if (isUuid(doc.id)) return doc;
  return { ...doc, id: crypto.randomUUID() };
};

const normalizeDocumentHistory = (history: GeneratedDocument[]): GeneratedDocument[] => {
  let changed = false;

  const normalized = history.map((doc) => {
    if (isUuid(doc.id)) return doc;
    changed = true;
    return { ...doc, id: crypto.randomUUID() };
  });

  return changed ? sortDocumentHistory(normalized) : history;
};

const getCachedDocumentHistory = (): GeneratedDocument[] => {
  const raw = localStorage.getItem(HISTORY_KEY);
  const parsed = raw ? JSON.parse(raw) : [];
  const history = Array.isArray(parsed) ? (parsed as GeneratedDocument[]) : [];
  const normalized = normalizeDocumentHistory(history);

  if (normalized !== history) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(normalized));
  }

  return normalized;
};

const setCachedDocumentHistory = (history: GeneratedDocument[]) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

export function getDocumentHistory(): GeneratedDocument[] {
  return getCachedDocumentHistory();
}

const fetchRemoteDocumentHistory = async (userId: string): Promise<GeneratedDocument[] | null> => {
  const { data, error } = await db
    .from('generated_documents')
    .select('*')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Erro ao buscar histórico no servidor:', error);
    return null;
  }

  return (data as GeneratedDocumentRow[] | null)?.map(mapRowToGeneratedDocument) || [];
};

export async function loadDocumentHistoryFromServer(): Promise<GeneratedDocument[]> {
  if (documentHistorySyncPromise) return documentHistorySyncPromise;

  documentHistorySyncPromise = (async () => {
    const cached = getCachedDocumentHistory();
    const userId = await getCurrentUserId();
    if (!userId) return cached;

    const remote = await fetchRemoteDocumentHistory(userId);
    if (!remote) return cached;

    const remoteIds = new Set(remote.map((doc) => doc.id));
    const localOnly = cached.filter((doc) => !remoteIds.has(doc.id) && isUuid(doc.id));

    if (localOnly.length > 0) {
      const payload = localOnly.map((doc) => mapDocumentToDb(doc, userId));
      const { error: syncError } = await db
        .from('generated_documents')
        .upsert(payload, { onConflict: 'id' });

      if (syncError) {
        console.error('Erro ao sincronizar histórico local:', syncError);
      }
    }

    const reconciled = localOnly.length > 0
      ? (await fetchRemoteDocumentHistory(userId)) ?? remote
      : remote;

    const sorted = sortDocumentHistory(reconciled).slice(0, 100);
    setCachedDocumentHistory(sorted);
    return sorted;
  })();

  try {
    return await documentHistorySyncPromise;
  } finally {
    documentHistorySyncPromise = null;
  }
}

async function syncDocumentToServer(doc: GeneratedDocument): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error } = await db
    .from('generated_documents')
    .upsert(mapDocumentToDb(doc, userId), { onConflict: 'id' });

  if (error) {
    console.error('Erro ao salvar histórico no servidor:', error);
  }
}

async function deleteDocumentFromServer(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error } = await db
    .from('generated_documents')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao excluir histórico no servidor:', error);
  }
}

export function addDocumentToHistory(doc: GeneratedDocument): void {
  const normalizedDoc = normalizeDocumentId(doc);
  const history = getCachedDocumentHistory().filter((item) => item.id !== normalizedDoc.id);
  const next = sortDocumentHistory([normalizedDoc, ...history]).slice(0, 100);
  setCachedDocumentHistory(next);
  void syncDocumentToServer(normalizedDoc);
}

export function deleteDocumentFromHistory(id: string): void {
  const history = getCachedDocumentHistory().filter((d) => d.id !== id);
  setCachedDocumentHistory(history);
  void deleteDocumentFromServer(id);
}

export function getDocumentById(id: string): GeneratedDocument | undefined {
  return getCachedDocumentHistory().find((d) => d.id === id);
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
