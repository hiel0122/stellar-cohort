import { useState, useEffect, useCallback } from "react";
import type { CourseTargets } from "@/lib/types";

const STORAGE_KEY = "dashboard_targets";

function loadAll(): Record<string, CourseTargets> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, CourseTargets>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function makeKey(instructorId: string, courseId: string): string {
  return `${instructorId}::${courseId}`;
}

export function useTargets(instructorId: string, courseId: string) {
  const key = makeKey(instructorId, courseId);

  const [targets, setTargetsState] = useState<CourseTargets | null>(() => {
    const all = loadAll();
    return all[key] ?? null;
  });

  // Sync when instructor/course changes
  useEffect(() => {
    const all = loadAll();
    setTargetsState(all[key] ?? null);
  }, [key]);

  const setTargets = useCallback((t: CourseTargets) => {
    const all = loadAll();
    all[key] = t;
    saveAll(all);
    setTargetsState(t);
  }, [key]);

  const clearTargets = useCallback(() => {
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
