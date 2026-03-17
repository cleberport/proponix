const STORAGE_KEY = 'budget-input-history';
const MAX_SUGGESTIONS = 10;

interface InputHistoryStore {
  [fieldKey: string]: string[];
}

function getStore(): InputHistoryStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStore(store: InputHistoryStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function addToInputHistory(fieldKey: string, value: string): void {
  if (!value || !value.trim()) return;
  const trimmed = value.trim();
  const store = getStore();
  const existing = store[fieldKey] || [];
  // Remove duplicate (case-insensitive) and prepend
  const filtered = existing.filter((v) => v.toLowerCase() !== trimmed.toLowerCase());
  filtered.unshift(trimmed);
  store[fieldKey] = filtered.slice(0, MAX_SUGGESTIONS);
  saveStore(store);
}

export function getInputHistory(fieldKey: string): string[] {
  return getStore()[fieldKey] || [];
}

export function saveAllInputs(inputs: Record<string, string>): void {
  for (const [key, value] of Object.entries(inputs)) {
    addToInputHistory(key, value);
  }
}
