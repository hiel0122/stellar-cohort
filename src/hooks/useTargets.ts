import { useState, useEffect, useCallback } from "react";
import type { CourseTargets } from "@/lib/types";

const STORAGE_KEY_V2 = "kpi_targets_v2";

function loadAll(): Record<string, CourseTargets> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V2);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, CourseTargets>) {
  localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(data));
}

export function makeTargetKey(instructorName: string, courseTitle: string, cohortNo: number): string {
  return `${instructorName.trim()}::${courseTitle.trim()}::${cohortNo}`;
}

/** Load all targets (for external read) */
export function loadAllTargets(): Record<string, CourseTargets> {
  return loadAll();
}

/** Save all targets (for external write) */
export function saveAllTargets(data: Record<string, CourseTargets>) {
  saveAll(data);
}

export function useTargets(instructorName: string, courseTitle: string, cohortNo: number | null) {
  const key = cohortNo != null ? makeTargetKey(instructorName, courseTitle, cohortNo) : "";

  const [targets, setTargetsState] = useState<CourseTargets | null>(() => {
    if (!key) return null;
    const all = loadAll();
    return all[key] ?? null;
  });

  // Sync when key changes
  useEffect(() => {
    if (!key) { setTargetsState(null); return; }
    const all = loadAll();
    setTargetsState(all[key] ?? null);
  }, [key]);

  const setTargets = useCallback((t: CourseTargets) => {
    if (!key) return;
    const all = loadAll();
    all[key] = t;
    saveAll(all);
    setTargetsState(t);
  }, [key]);

  const clearTargets = useCallback(() => {
    if (!key) return;
    const all = loadAll();
    delete all[key];
    saveAll(all);
    setTargetsState(null);
  }, [key]);

  return { targets, setTargets, clearTargets };
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
