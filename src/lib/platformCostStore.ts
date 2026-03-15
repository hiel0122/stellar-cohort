// Platform cost store with localStorage persistence.
// Supports multiple cost records per cohort (multi-platform).

const STORAGE_KEY = "kpi_platform_costs_v1";

export type PlatformKey = "generic" | "njab";

export interface PlatformCost {
  id: string;
  instructor_name: string;
  course_title: string;
  cohort_no: number;
  platform_name: string;
  platform_key: PlatformKey;
  fee_rate_pct: number;   // e.g. 7.5 means 7.5%
  fee_amount: number;
  ad_cost_amount: number;
  note: string;
  updated_at: string;
  details?: Record<string, unknown>; // platform-specific detail fields (JSON)
}

export interface CohortCostSummary {
  total_fee: number;
  total_ads: number;
  net_profit_l1: number;
  net_margin_l1: number | null; // null when revenue=0
  // Payout-based (from platform settlement details)
  settlement_total: number | null;  // null = no settlement form data
  payout: number | null;            // final_payout_amount sum
  payout_margin: number | null;     // payout / revenue %
}

// ── In-memory cache ──
let cache: PlatformCost[] | null = null;

function load(): PlatformCost[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: PlatformCost[] = raw ? JSON.parse(raw) : [];
    // Backfill platform_key for legacy records
    cache = parsed.map(c => ({ ...c, platform_key: c.platform_key ?? "generic" as PlatformKey }));
  } catch {
    cache = [];
  }
  return cache!;
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache!));
  notify();
}

// ── Public API ──

export function loadPlatformCosts(): PlatformCost[] {
  return load();
}

export function getCostsForCohort(
  instructorName: string,
  courseTitle: string,
  cohortNo: number
): PlatformCost[] {
  return load().filter(
    (c) =>
      c.instructor_name === instructorName &&
      c.course_title === courseTitle &&
      c.cohort_no === cohortNo
  );
}

export function getCohortCostSummary(
  instructorName: string,
  courseTitle: string,
  cohortNo: number,
  revenue: number
): CohortCostSummary | null {
  const costs = getCostsForCohort(instructorName, courseTitle, cohortNo);
  if (costs.length === 0) return null;
  const total_fee = costs.reduce((s, c) => s + c.fee_amount, 0);
  const total_ads = costs.reduce((s, c) => s + c.ad_cost_amount, 0);

  // Payout-based: sum from platform settlement details
  const payoutCosts = costs.filter(
    (c) => c.details && typeof (c.details as Record<string, unknown>).final_payout_amount === "number"
  );
  const settlement_total = payoutCosts.length > 0
    ? payoutCosts.reduce((s, c) => s + ((c.details as Record<string, unknown>).total_settlement_amount as number ?? 0), 0)
    : null;
  const payout = payoutCosts.length > 0
    ? payoutCosts.reduce((s, c) => s + ((c.details as Record<string, unknown>).final_payout_amount as number), 0)
    : null;

  // Use total_sales from njab details as denominator if available, else revenue
  const njabCost = costs.find(c => c.platform_key === "njab" && c.details && typeof (c.details as Record<string, unknown>).total_sales === "number");
  const marginDenom = njabCost ? ((njabCost.details as Record<string, unknown>).total_sales as number) : revenue;
  const payout_margin = payout != null && marginDenom > 0 ? (payout / marginDenom) * 100 : null;

  // net_profit_l1 now equals payout when available, else falls back to simple calc
  const net_profit_l1 = payout != null ? payout : revenue - total_fee - total_ads;
  const net_margin_l1 = marginDenom > 0 ? (net_profit_l1 / marginDenom) * 100 : null;

  return { total_fee, total_ads, net_profit_l1, net_margin_l1, settlement_total, payout, payout_margin };
}

let idCounter = Date.now();
export function generateCostId(): string {
  return `cost-${++idCounter}`;
}

export function upsertPlatformCost(cost: PlatformCost) {
  const list = load();
  const idx = list.findIndex((c) => c.id === cost.id);
  const updated = { ...cost, updated_at: new Date().toISOString() };
  if (idx >= 0) {
    cache = [...list.slice(0, idx), updated, ...list.slice(idx + 1)];
  } else {
    cache = [...list, updated];
  }
  persist();
}

export function deletePlatformCost(id: string) {
  cache = load().filter((c) => c.id !== id);
  persist();
}

export function getRecentPlatformNames(): string[] {
  const all = load();
  const names = [...new Set(all.map((c) => c.platform_name).filter(Boolean))];
  return names.slice(0, 5);
}

// ── Reactivity ──
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribePlatformCostStore(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn());
}
