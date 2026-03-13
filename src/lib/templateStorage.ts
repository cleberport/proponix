import { Template, SavedTemplate } from '@/types/template';
import { starterTemplates } from '@/data/templates';

const STORAGE_KEY = 'budget-template-builder-templates';

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

export function getTemplateById(id: string): Template | undefined {
  const saved = getSavedTemplates().find((t) => t.id === id);
  if (saved) return saved;
  return starterTemplates.find((t) => t.id === id);
}
