// localStorage-backed overrides layer for cohort data.
// Key: cohortId → partial cohort fields.

const STORAGE_KEY = "kpi_dashboard_overrides_v1";

export interface CohortOverride {
  revenue?: number;
  students?: number;
  leads?: number;
  applied?: number;
  status?: "planned" | "active" | "closed";
  start_date?: string;
}

type OverridesMap = Record<string, CohortOverride>;

let cache: OverridesMap | null = null;

function load(): OverridesMap {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? JSON.parse(raw) : {};
  } catch {
    cache = {};
  }
  return cache!;
}

function persist(map: OverridesMap) {
  cache = map;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getOverride(cohortId: string): CohortOverride | undefined {
  return load()[cohortId];
}

export function getAllOverrides(): OverridesMap {
  return { ...load() };
}

export function saveOverride(cohortId: string, override: CohortOverride) {
  const map = load();
  map[cohortId] = { ...map[cohortId], ...override };
  persist(map);
}

export function removeOverride(cohortId: string) {
  const map = load();
  delete map[cohortId];
  persist(map);
}

// Listeners for reactivity
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeOverrides(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notifyOverrides() {
  listeners.forEach((fn) => fn());
}

/** Save + notify so hooks re-render */
export function commitOverride(cohortId: string, override: CohortOverride) {
  saveOverride(cohortId, override);
  notifyOverrides();
}

/** Restore previous values + notify */
export function revertOverride(cohortId: string, previous: CohortOverride | undefined) {
  if (previous) {
    saveOverride(cohortId, previous);
  } else {
    removeOverride(cohortId);
  }
  notifyOverrides();
}
