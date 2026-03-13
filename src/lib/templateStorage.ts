import { Template, SavedTemplate } from '@/types/template';
import { starterTemplates } from '@/data/templates';

const STORAGE_KEY = 'budget-template-builder-templates';
const SETTINGS_KEY = 'budget-template-builder-settings';

export interface AppSettings {
  profileName: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  defaultTaxRate: number;
  logoUrl: string;
  theme: 'light' | 'dark';
}

const DEFAULT_SETTINGS: AppSettings = {
  profileName: '',
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  defaultTaxRate: 0.10,
  logoUrl: '',
  theme: 'light',
};

export function getSettings(): AppSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getStarterTemplates(): Template[] {
  return starterTemplates;
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

export function deleteTemplate(id: string): void {
  const all = getSavedTemplates().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function restoreDefaultTemplates(): void {
  const saved = getSavedTemplates();
  const starterIds = starterTemplates.map((t) => t.id);
  // Remove any saved versions of starter templates
  const filtered = saved.filter((t) => !starterIds.includes(t.id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function getTemplateById(id: string): Template | undefined {
  const saved = getSavedTemplates().find((t) => t.id === id);
  if (saved) return saved;
  return starterTemplates.find((t) => t.id === id);
}
