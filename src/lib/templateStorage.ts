import { Template, SavedTemplate } from '@/types/template';
import { starterTemplates } from '@/data/templates';

const STORAGE_KEY = 'budget-template-builder-templates';
const SETTINGS_KEY = 'budget-template-builder-settings';
const HISTORY_KEY = 'budget-template-builder-history';
const PDF_COUNTER_KEY = 'budget-template-builder-pdf-counter';
const HIDDEN_STARTERS_KEY = 'budget-template-builder-hidden-starters';

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
  pdfBaseName: 'Orçamento',
  defaultTemplateId: '',
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

export function getSavedTemplates(): SavedTemplate[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveTemplate(template: Template): SavedTemplate {
  const saved: SavedTemplate = {
    ...template,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const all = getSavedTemplates();
  const idx = all.findIndex((t) => t.id === saved.id);
  if (idx >= 0) {
    saved.createdAt = all[idx].createdAt;
    all[idx] = saved;
  } else {
    all.push(saved);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return saved;
}

export function duplicateTemplate(id: string): SavedTemplate | null {
  const original = getTemplateById(id);
  if (!original) return null;
  const copy: Template = {
    ...original,
    id: crypto.randomUUID(),
    name: `${original.name} (Cópia)`,
  };
  return saveTemplate(copy);
}

export function deleteTemplate(id: string): void {
  const all = getSavedTemplates().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function restoreDefaultTemplates(): void {
  const saved = getSavedTemplates();
  const starterIds = starterTemplates.map((t) => t.id);
  const filtered = saved.filter((t) => !starterIds.includes(t.id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function getTemplateById(id: string): Template | undefined {
  const saved = getSavedTemplates().find((t) => t.id === id);
  if (saved) return saved;
  return starterTemplates.find((t) => t.id === id);
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
  const baseName = settings.pdfBaseName || 'Orçamento';
  const num = getNextPdfNumber();
  return `${baseName} ${String(num).padStart(3, '0')}.pdf`;
}
