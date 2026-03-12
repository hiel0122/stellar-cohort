import type { CourseTargets } from "@/lib/types";
import { normalizeWeak } from "@/lib/normalize";

const STORAGE_KEY = "kpi_targets_v2";

type Listener = () => void;

let listeners: Listener[] = [];
let cache: Record<string, CourseTargets> = loadFromStorage();
let snapshot = cache;

function loadFromStorage(): Record<string, CourseTargets> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

function notify() {
  for (const l of listeners) l();
}

export function subscribe(listener: Listener): () => void {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getSnapshot(): Record<string, CourseTargets> {
  return snapshot;
}

export function loadAllTargets(): Record<string, CourseTargets> {
  return snapshot;
}

export function upsertTarget(key: string, target: CourseTargets) {
  cache = { ...cache, [key]: target };
  snapshot = cache;
  persist();
  notify();
}

export function deleteTarget(key: string) {
  const { [key]: _, ...rest } = cache;
  cache = rest;
  snapshot = cache;
  persist();
  notify();
}

export function makeTargetKey(instructorName: string, courseTitle: string, cohortNo: number): string {
  return `${instructorName.trim()}::${courseTitle.trim()}::${cohortNo}`;
}
