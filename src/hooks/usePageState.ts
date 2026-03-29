import { useState, useEffect, useRef, useCallback } from "react";
import { savePageState, loadPageState } from "@/lib/persistedUiStore";

/**
 * Drop-in replacement for useState that persists to sessionStorage.
 *
 * @param pageKey  Unique key per page (e.g. "dashboard", "survey")
 * @param stateKey Key within the page state map
 * @param defaultValue  Initial value if nothing is persisted
 *
 * Security: Do NOT use for passwords, tokens, API keys.
 */
export function usePageState<T>(
  pageKey: string,
  stateKey: string,
  defaultValue: T,
): [T, (v: T | ((prev: T) => T)) => void] {
  const hydratedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const [value, setValueRaw] = useState<T>(() => {
    const saved = loadPageState<Record<string, unknown>>(pageKey);
    if (saved && stateKey in saved) {
      hydratedRef.current = true;
      return saved[stateKey] as T;
    }
    return defaultValue;
  });

  // Debounced save
  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      const existing = loadPageState<Record<string, unknown>>(pageKey) ?? {};
      existing[stateKey] = value;
      savePageState(pageKey, existing);
    }, 300);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [pageKey, stateKey, value]);

  // Flush on beforeunload
  useEffect(() => {
    const flush = () => {
      const existing = loadPageState<Record<string, unknown>>(pageKey) ?? {};
      existing[stateKey] = value;
      savePageState(pageKey, existing);
    };
    window.addEventListener("beforeunload", flush);
    return () => window.removeEventListener("beforeunload", flush);
  }, [pageKey, stateKey, value]);

  const setValue = useCallback((v: T | ((prev: T) => T)) => {
    setValueRaw(v);
  }, []);

  return [value, setValue];
}
