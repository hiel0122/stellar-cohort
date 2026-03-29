import { useEffect, useRef } from "react";
import type { CompareMode } from "./useDashboardData";

const STORAGE_KEY = "dashboard_filters_v1";

export interface DashboardFilterState {
  instructorId: string;
  courseId: string;
  cohortId: string;
  compareMode: CompareMode;
  baselineCohortId: string;
  crossInstructorId: string;
  crossCourseId: string;
  crossCohortId: string;
}

export function saveDashboardFilters(state: DashboardFilterState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded — ignore
  }
}

export function loadDashboardFilters(): DashboardFilterState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DashboardFilterState;
  } catch {
    return null;
  }
}

/**
 * Debounced persistence of dashboard filter selections.
 * Returns `restoredRef` — true while initial restore is in progress
 * (callers should skip triggering data fetches during restore).
 */
export function useDashboardFilterPersistence(
  state: DashboardFilterState,
  setters: {
    setInstructorId: (v: string) => void;
    setCourseId: (v: string) => void;
    setCohortId: (v: string) => void;
    setCompareMode: (v: CompareMode) => void;
    setBaselineCohortId: (v: string) => void;
    setCrossInstructorId: (v: string) => void;
    setCrossCourseId: (v: string) => void;
    setCrossCohortId: (v: string) => void;
  },
) {
  const restoredRef = useRef(false);

  // Restore once on mount
  useEffect(() => {
    const saved = loadDashboardFilters();
    if (saved) {
      setters.setInstructorId(saved.instructorId);
      setters.setCourseId(saved.courseId);
      setters.setCohortId(saved.cohortId);
      setters.setCompareMode(saved.compareMode);
      setters.setBaselineCohortId(saved.baselineCohortId);
      setters.setCrossInstructorId(saved.crossInstructorId);
      setters.setCrossCourseId(saved.crossCourseId);
      setters.setCrossCohortId(saved.crossCohortId);
    }
    // Mark restore complete after a tick so effects settle
    requestAnimationFrame(() => {
      restoredRef.current = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save on change (debounced 300ms)
  useEffect(() => {
    if (!restoredRef.current) return;
    const t = setTimeout(() => saveDashboardFilters(state), 300);
    return () => clearTimeout(t);
  }, [state]);

  return restoredRef;
}
