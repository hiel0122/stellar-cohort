import { useState, useEffect, useCallback, useRef } from "react";
import { useDashboardData } from "./useDashboardData";
import {
  useDashboardFilterPersistence,
  type DashboardFilterState,
} from "./useDashboardFilterPersistence";
import type { CohortKpi, FunnelData, ChecklistSummary, Enrollment } from "@/lib/types";

/** Stable hash for quick equality check on dashboard snapshot */
function snapshotHash(kpis: CohortKpi[], funnel: FunnelData | null): string {
  const kpiPart = kpis
    .map((k) => `${k.cohort_id}:${k.revenue}:${k.students}:${k.leads}:${k.applied}`)
    .join("|");
  const funnelPart = funnel ? `${funnel.lead}:${funnel.applied}:${funnel.paid}` : "null";
  return `${kpiPart};;${funnelPart}`;
}

interface Snapshot {
  kpis: CohortKpi[];
  funnel: FunnelData | null;
  checklist: ChecklistSummary | null;
  enrollments: Enrollment[];
  hash: string;
}

/**
 * Wraps useDashboardData with:
 * 1) filter state persistence (sessionStorage)
 * 2) SWR-style active/pending data split
 * 3) background refresh on tab return with "apply" banner
 */
export function useSWRDashboard() {
  const dashboard = useDashboardData();

  // ── Filter persistence ──
  const filterState: DashboardFilterState = {
    instructorId: dashboard.instructorId,
    courseId: dashboard.courseId,
    cohortId: dashboard.cohortId,
    compareMode: dashboard.compareMode,
    baselineCohortId: dashboard.baselineCohortId,
    crossInstructorId: dashboard.crossInstructorId,
    crossCourseId: dashboard.crossCourseId,
    crossCohortId: dashboard.crossCohortId,
  };

  useDashboardFilterPersistence(filterState, {
    setInstructorId: dashboard.handleInstructorChange,
    setCourseId: dashboard.handleCourseChange,
    setCohortId: dashboard.handleCohortChange,
    setCompareMode: dashboard.handleCompareModeChange,
    setBaselineCohortId: dashboard.handleBaselineChange,
    setCrossInstructorId: dashboard.handleCrossInstructorChange,
    setCrossCourseId: dashboard.handleCrossCourseChange,
    setCrossCohortId: dashboard.handleCrossCohortChange,
  });

  // ── SWR: active vs pending snapshot ──
  const [activeSnapshot, setActiveSnapshot] = useState<Snapshot | null>(null);
  const [pendingSnapshot, setPendingSnapshot] = useState<Snapshot | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const initialLoadDone = useRef(false);

  // Build current live snapshot from dashboard data
  const liveHash = snapshotHash(dashboard.kpis, dashboard.funnel);

  // On initial load or user-driven filter changes, apply data immediately
  useEffect(() => {
    if (dashboard.loadState !== "success") return;
    if (!initialLoadDone.current) {
      // First load — set active directly
      initialLoadDone.current = true;
      setActiveSnapshot({
        kpis: dashboard.kpis,
        funnel: dashboard.funnel,
        checklist: dashboard.checklist,
        enrollments: dashboard.enrollments,
        hash: liveHash,
      });
      return;
    }
    // User-driven change (filter change triggers loadState cycle) — apply immediately
    if (!backgroundRefreshRef.current) {
      setActiveSnapshot({
        kpis: dashboard.kpis,
        funnel: dashboard.funnel,
        checklist: dashboard.checklist,
        enrollments: dashboard.enrollments,
        hash: liveHash,
      });
      // Clear any pending
      setPendingSnapshot(null);
      setUpdateAvailable(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard.loadState, dashboard.kpis, dashboard.funnel, dashboard.checklist, dashboard.enrollments]);

  // ── Background refresh tracking ──
  const backgroundRefreshRef = useRef(false);
  const inFlightRef = useRef(false);

  // When background refresh completes, compare with active
  useEffect(() => {
    if (!backgroundRefreshRef.current) return;
    if (dashboard.loadState !== "success") return;

    backgroundRefreshRef.current = false;

    if (activeSnapshot && liveHash !== activeSnapshot.hash) {
      // Check dismissed hash
      let dismissed: string | null = null;
      try { dismissed = sessionStorage.getItem("swr_dismissed_hash"); } catch {}
      if (dismissed === liveHash) return;

      setPendingSnapshot({
        kpis: dashboard.kpis,
        funnel: dashboard.funnel,
        checklist: dashboard.checklist,
        enrollments: dashboard.enrollments,
        hash: liveHash,
      });
      setUpdateAvailable(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard.loadState, liveHash]);

  // ── Visibility change: silent background refresh ──
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) return;
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      setTimeout(() => {
        backgroundRefreshRef.current = true;
        dashboard.triggerRefresh();
        // Reset flight flag after a reasonable window
        setTimeout(() => {
          inFlightRef.current = false;
        }, 3000);
      }, 400);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [dashboard.triggerRefresh]);

  // ── Dismissed hash (sessionStorage) ──
  const DISMISSED_KEY = "swr_dismissed_hash";

  // ── Apply / Dismiss ──
  const applyPending = useCallback(() => {
    if (pendingSnapshot) {
      setActiveSnapshot(pendingSnapshot);
      setPendingSnapshot(null);
      setUpdateAvailable(false);
    }
  }, [pendingSnapshot]);

  const dismissPending = useCallback(() => {
    if (pendingSnapshot) {
      try {
        sessionStorage.setItem(DISMISSED_KEY, pendingSnapshot.hash);
      } catch {}
    }
    setPendingSnapshot(null);
    setUpdateAvailable(false);
  }, [pendingSnapshot]);

  // Manual refresh button
  const manualRefresh = useCallback(() => {
    backgroundRefreshRef.current = true;
    dashboard.triggerRefresh();
  }, [dashboard.triggerRefresh]);

  // Use active snapshot data if available, otherwise fall through to live
  const data = activeSnapshot ?? {
    kpis: dashboard.kpis,
    funnel: dashboard.funnel,
    checklist: dashboard.checklist,
    enrollments: dashboard.enrollments,
    hash: liveHash,
  };

  return {
    // All original dashboard props (filters, handlers, metadata)
    ...dashboard,
    // Override data fields with active snapshot
    kpis: data.kpis,
    funnel: data.funnel,
    checklist: data.checklist,
    enrollments: data.enrollments,
    // SWR controls
    updateAvailable,
    applyPending,
    dismissPending,
    manualRefresh,
  };
}
