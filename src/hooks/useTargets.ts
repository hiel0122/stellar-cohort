import { useSyncExternalStore } from "react";
import type { CourseTargets } from "@/lib/types";
import {
  subscribe,
  getSnapshot,
  makeTargetKey,
  upsertTarget,
  deleteTarget,
  loadAllTargets,
} from "@/lib/targetStore";

// Re-export store utilities for external use
export { makeTargetKey, upsertTarget, deleteTarget, loadAllTargets };

export function useTargets(instructorName: string, courseTitle: string, cohortNo: number | null) {
  const all = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const key = cohortNo != null ? makeTargetKey(instructorName, courseTitle, cohortNo) : "";
  const targets = key ? (all[key] ?? null) : null;

  return { targets, setTargets: (t: CourseTargets) => { if (key) upsertTarget(key, t); }, clearTargets: () => { if (key) deleteTarget(key); } };
}

// ── Utility functions ──
export function calcProgress(current: number, target: number | null): number | null {
  if (target == null || target === 0) return null;
  return Math.min(Math.max(current / target, 0), 1);
}

export function calcRemaining(target: number | null, current: number): number | null {
  if (target == null) return null;
  return Math.max(target - current, 0);
}

export function calcDeltaPp(currentPct: number, targetPct: number | null): number | null {
  if (targetPct == null) return null;
  return currentPct - targetPct;
}
