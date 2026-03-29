/**
 * Global UI State Persistence Framework
 *
 * Provides sessionStorage-backed state persistence for all pages.
 * - Auto-saves on state change (debounced 300ms)
 * - Flushes on beforeunload
 * - Restores on mount
 * - Scroll position tracking per pathname
 *
 * Security: never stores passwords, tokens, API keys, or raw PII.
 */

const PREFIX = "ct:ui:";
const SCROLL_KEY = `${PREFIX}scroll`;
const PAGE_STATE_KEY = `${PREFIX}pages`;

// ── Internal helpers ──

function readJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded — silently ignore
  }
}

// ── Scroll persistence ──

type ScrollMap = Record<string, number>;

export function saveScrollPosition(pathname: string) {
  const map = readJson<ScrollMap>(SCROLL_KEY) ?? {};
  map[pathname] = window.scrollY;
  writeJson(SCROLL_KEY, map);
}

export function restoreScrollPosition(pathname: string): number {
  const map = readJson<ScrollMap>(SCROLL_KEY);
  return map?.[pathname] ?? 0;
}

// ── Page state persistence ──

type PageStateMap = Record<string, Record<string, unknown>>;

export function savePageState(pageKey: string, state: Record<string, unknown>) {
  const map = readJson<PageStateMap>(PAGE_STATE_KEY) ?? {};
  map[pageKey] = state;
  writeJson(PAGE_STATE_KEY, map);
}

export function loadPageState<T extends Record<string, unknown>>(pageKey: string): T | null {
  const map = readJson<PageStateMap>(PAGE_STATE_KEY);
  if (!map || !map[pageKey]) return null;
  return map[pageKey] as T;
}

export function clearAllPersistedState() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith(PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => sessionStorage.removeItem(k));
}

export function getAllPersistedState(): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith(PREFIX)) {
      try {
        result[key] = JSON.parse(sessionStorage.getItem(key)!);
      } catch {
        result[key] = sessionStorage.getItem(key);
      }
    }
  }
  return result;
}
