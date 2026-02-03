const KEY = "cp_funnel_builder_v1";

export function saveToLocalStorage(value: unknown) {
  localStorage.setItem(KEY, JSON.stringify(value));
}

export function loadFromLocalStorage<T>(): T | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}
