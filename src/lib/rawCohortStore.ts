// Raw cohort data store with localStorage persistence.
// Replaces the overrides layer with a full data-ownership model.

const STORAGE_KEY = "kpi_raw_cohorts_v1";

export interface RawCohort {
  id: string;
  instructor_name: string;
  course_title: string;
  cohort_no: number;
  status: "planned" | "active" | "closed";
  start_date: string;
  revenue: number;
  leads: number;
  applied: number;
  students: number;
}

// ── Seed data (used when localStorage is empty) ──
const seedData: RawCohort[] = [
  { id: "coh-보부상-[N잡연구소x보부상]-4", instructor_name: "보부상", course_title: "[N잡연구소x보부상]", cohort_no: 4, status: "closed", revenue: 150000000, students: 48, leads: 2500, applied: 800, start_date: "2025-12-01" },
  { id: "coh-보부상-[N잡연구소x보부상]-5", instructor_name: "보부상", course_title: "[N잡연구소x보부상]", cohort_no: 5, status: "active", revenue: 20019915, students: 48, leads: 2300, applied: 550, start_date: "2026-01-31" },
  { id: "coh-최대표-[타이탄x최대표]-1", instructor_name: "최대표", course_title: "[타이탄x최대표]", cohort_no: 1, status: "active", revenue: 293000000, students: 105, leads: 2600, applied: 915, start_date: "2026-02-22" },
  { id: "coh-빽형-[싸이클해커스x빽형]-1", instructor_name: "빽형", course_title: "[싸이클해커스x빽형]", cohort_no: 1, status: "active", revenue: 65000000, students: 25, leads: 2200, applied: 440, start_date: "2026-02-21" },
];

// ── In-memory cache ──
let cache: RawCohort[] | null = null;

function load(): RawCohort[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? JSON.parse(raw) : [...seedData];
  } catch {
    cache = [...seedData];
  }
  // Persist seed if first load
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  }
  return cache!;
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache!));
  notify();
}

// ── Public API ──

export function loadRawCohorts(): RawCohort[] {
  return [...load()];
}

export function getRawCohort(id: string): RawCohort | undefined {
  return load().find((c) => c.id === id);
}

export function makeId(instructorName: string, courseTitle: string, cohortNo: number): string {
  return `coh-${instructorName}-${courseTitle}-${cohortNo}`;
}

export function upsertRawCohort(cohort: RawCohort) {
  const list = load();
  const idx = list.findIndex((c) => c.id === cohort.id);
  if (idx >= 0) {
    list[idx] = { ...cohort };
  } else {
    list.push({ ...cohort });
  }
  cache = list;
  persist();
}

export function deleteRawCohort(id: string) {
  cache = load().filter((c) => c.id !== id);
  persist();
}

export function getNextCohortNo(instructorName: string, courseTitle: string): number {
  const list = load().filter(
    (c) => c.instructor_name === instructorName && c.course_title === courseTitle
  );
  if (list.length === 0) return 1;
  return Math.max(...list.map((c) => c.cohort_no)) + 1;
}

// ── Reactivity (subscription pattern) ──
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeRawStore(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn());
}
