import { CanvasElement, Template, SavedTemplate, TemplateSettings, getTemplatePages } from '@/types/template';
import { starterTemplates } from '@/data/templates';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'budget-template-builder-templates';
const SETTINGS_KEY = 'budget-template-builder-settings';
const HISTORY_KEY = 'budget-template-builder-history';
const PDF_COUNTER_KEY = 'budget-template-builder-pdf-counter';
const HIDDEN_STARTERS_KEY = 'budget-template-builder-hidden-starters';
const LEGACY_TEMPLATE_ID_MAP_KEY = 'budget-template-builder-legacy-template-id-map';
...
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
    );
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
...
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
...
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
