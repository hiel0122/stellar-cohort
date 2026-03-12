import { useState, useEffect, useCallback, useMemo } from "react";
import type { DataProvider } from "@/lib/dataProvider";
import type {
  Instructor, Course, Cohort, CohortKpi,
  FunnelData, ChecklistSummary, Enrollment,
} from "@/lib/types";
import { mockProvider } from "@/lib/providers/mockProvider";
import { useRawCohortStore } from "@/hooks/useRawCohortStore";

const provider: DataProvider = mockProvider;

export type LoadState = "idle" | "loading" | "error" | "success";
export type CompareMode = "off" | "prev" | "select" | "cross";

export function useDashboardData() {
  const rawCohorts = useRawCohortStore();
  const rawKey = rawCohorts.length + rawCohorts.reduce((s, c) => s + c.revenue + c.students + c.leads + c.applied + c.cohort_no, 0);

  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Filter state
  const [instructorId, setInstructorId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [cohortId, setCohortId] = useState("");

  // Compare mode
  const [compareMode, setCompareMode] = useState<CompareMode>("off");
  const [baselineCohortId, setBaselineCohortId] = useState<string>("");

  // Cross-instructor compare state
  const [crossInstructorId, setCrossInstructorId] = useState<string>("");
  const [crossCourseId, setCrossCourseId] = useState<string>("");
  const [crossCohortId, setCrossCohortId] = useState<string>("");
  const [crossCourses, setCrossCourses] = useState<Course[]>([]);
  const [crossCohorts, setCrossCohorts] = useState<Cohort[]>([]);
  const [crossKpis, setCrossKpis] = useState<CohortKpi[]>([]);

  // Data
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [kpis, setKpis] = useState<CohortKpi[]>([]);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [checklist, setChecklist] = useState<ChecklistSummary | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  // Loading states
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [detailLoadState, setDetailLoadState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Init: load instructors
  useEffect(() => {
    setLoadState("loading");
    provider
      .listInstructors()
      .then((list) => {
        setInstructors(list);
        setInstructorId((prev) => {
          if (prev && list.some((i) => i.id === prev)) return prev;
          return list.length > 0 ? list[0].id : "";
        });
        setLoadState("success");
      })
      .catch((e) => {
        setError(e.message);
        setLoadState("error");
      });
  }, [rawKey, refreshKey]);

  // When instructor changes → load courses
  useEffect(() => {
    if (!instructorId) return;
    provider.listCourses(instructorId).then((list) => {
      setCourses(list);
      setCourseId((prev) => {
        if (prev && list.some((c) => c.id === prev)) return prev;
        return list.length > 0 ? list[0].id : "";
      });
    });
  }, [instructorId, rawKey, refreshKey]);

  // When course changes → load cohorts + KPIs
  useEffect(() => {
    if (!instructorId || !courseId) return;
    setLoadState("loading");
    Promise.all([
      provider.listCohorts(instructorId, courseId),
      provider.getCohortKpis(instructorId, courseId),
    ])
      .then(([cohortList, kpiList]) => {
        setCohorts(cohortList);
        setKpis(kpiList);
        setCohortId((prev) => {
          if (prev && cohortList.some((c) => c.id === prev)) return prev;
          return cohortList.length > 0 ? cohortList[cohortList.length - 1].id : "";
        });
        setLoadState("success");
      })
      .catch((e) => {
        setError(e.message);
        setLoadState("error");
      });
  }, [instructorId, courseId, rawKey, refreshKey]);

  // When cohort changes → load funnel + checklist + enrollments
  useEffect(() => {
    if (!cohortId) {
      setFunnel(null);
      setChecklist(null);
      setEnrollments([]);
      return;
    }
    setDetailLoadState("loading");
    Promise.all([
      provider.getFunnel(cohortId),
      provider.getChecklist(cohortId),
      provider.getRecentEnrollments(cohortId),
    ])
      .then(([f, cl, en]) => {
        setFunnel(f);
        setChecklist(cl);
        setEnrollments(en);
        setDetailLoadState("success");
      })
      .catch((e) => {
        setError(e.message);
        setDetailLoadState("error");
      });
  }, [cohortId, rawKey, refreshKey]);

  // ── Cross-instructor: load courses when crossInstructorId changes ──
  useEffect(() => {
    if (!crossInstructorId || compareMode !== "cross") {
      setCrossCourses([]);
      setCrossCourseId("");
      return;
    }
    provider.listCourses(crossInstructorId).then((list) => {
      setCrossCourses(list);
      setCrossCourseId((prev) => {
        if (prev && list.some((c) => c.id === prev)) return prev;
        return list.length > 0 ? list[0].id : "";
      });
    });
  }, [crossInstructorId, compareMode, rawKey]);

  // ── Cross-instructor: load cohorts + kpis when crossCourseId changes ──
  useEffect(() => {
    if (!crossInstructorId || !crossCourseId || compareMode !== "cross") {
      setCrossCohorts([]);
      setCrossKpis([]);
      setCrossCohortId("");
      return;
    }
    Promise.all([
      provider.listCohorts(crossInstructorId, crossCourseId),
      provider.getCohortKpis(crossInstructorId, crossCourseId),
    ]).then(([cohortList, kpiList]) => {
      setCrossCohorts(cohortList);
      setCrossKpis(kpiList);
      setCrossCohortId((prev) => {
        if (prev && cohortList.some((c) => c.id === prev)) return prev;
        return cohortList.length > 0 ? cohortList[cohortList.length - 1].id : "";
      });
    });
  }, [crossInstructorId, crossCourseId, compareMode, rawKey]);

  // Current KPI
  const currentKpi = useMemo(
    () => kpis.find((k) => k.cohort_id === cohortId) ?? null,
    [kpis, cohortId]
  );

  const currentCohort = useMemo(
    () => cohorts.find((c) => c.id === cohortId) ?? null,
    [cohorts, cohortId]
  );

  // ── Compare mode: resolve baseline ──
  const resolvedBaselineId = useMemo(() => {
    if (compareMode === "off") return "";
    if (compareMode === "select") return baselineCohortId;
    if (compareMode === "cross") return crossCohortId;
    if (!currentCohort) return "";
    const sorted = [...cohorts]
      .filter((c) => c.cohort_no < currentCohort.cohort_no)
      .sort((a, b) => b.cohort_no - a.cohort_no);
    return sorted[0]?.id ?? "";
  }, [compareMode, baselineCohortId, crossCohortId, currentCohort, cohorts]);

  const baselineKpi = useMemo(() => {
    if (!resolvedBaselineId) return null;
    if (compareMode === "cross") {
      return crossKpis.find((k) => k.cohort_id === resolvedBaselineId) ?? null;
    }
    return kpis.find((k) => k.cohort_id === resolvedBaselineId) ?? null;
  }, [kpis, crossKpis, resolvedBaselineId, compareMode]);

  const baselineCohort = useMemo(() => {
    if (!resolvedBaselineId) return null;
    if (compareMode === "cross") {
      return crossCohorts.find((c) => c.id === resolvedBaselineId) ?? null;
    }
    return cohorts.find((c) => c.id === resolvedBaselineId) ?? null;
  }, [cohorts, crossCohorts, resolvedBaselineId, compareMode]);

  // Baseline funnel
  const [baselineFunnel, setBaselineFunnel] = useState<FunnelData | null>(null);
  useEffect(() => {
    if (!resolvedBaselineId || compareMode === "off") {
      setBaselineFunnel(null);
      return;
    }
    provider.getFunnel(resolvedBaselineId).then(setBaselineFunnel);
  }, [resolvedBaselineId, compareMode]);

  // Cross compare label
  const crossBaselineLabel = useMemo(() => {
    if (compareMode !== "cross" || !crossCohortId) return null;
    const inst = instructors.find((i) => i.id === crossInstructorId);
    const course = crossCourses.find((c) => c.id === crossCourseId);
    const cohort = crossCohorts.find((c) => c.id === crossCohortId);
    if (!inst || !course || !cohort) return null;
    return `${inst.name}/${course.title}/${cohort.cohort_no}기`;
  }, [compareMode, crossCohortId, crossInstructorId, crossCourseId, instructors, crossCourses, crossCohorts]);

  // Sparkline arrays
  const sparklines = useMemo(() => ({
    revenue: kpis.map((k) => k.revenue),
    students: kpis.map((k) => k.students),
    leads: kpis.map((k) => k.leads),
    conversion: kpis.map((k) => k.conversion),
  }), [kpis]);

  // Handlers
  const handleInstructorChange = useCallback((v: string) => {
    setInstructorId(v);
  }, []);

  const handleCourseChange = useCallback((v: string) => {
    setCourseId(v);
  }, []);

  const handleCohortChange = useCallback((v: string) => {
    setCohortId(v);
  }, []);

  const handleReset = useCallback(() => {
    if (instructors.length > 0) {
      setInstructorId(instructors[0].id);
    }
    setCompareMode("off");
    setBaselineCohortId("");
    setCrossInstructorId("");
    setCrossCourseId("");
    setCrossCohortId("");
  }, [instructors]);

  const handleCompareModeChange = useCallback((mode: CompareMode) => {
    setCompareMode(mode);
    if (mode !== "select") setBaselineCohortId("");
    if (mode !== "cross") {
      setCrossInstructorId("");
      setCrossCourseId("");
      setCrossCohortId("");
    }
  }, []);

  const handleBaselineChange = useCallback((id: string) => {
    setBaselineCohortId(id);
  }, []);

  const handleCrossInstructorChange = useCallback((id: string) => {
    setCrossInstructorId(id);
    setCrossCourseId("");
    setCrossCohortId("");
  }, []);

  const handleCrossCourseChange = useCallback((id: string) => {
    setCrossCourseId(id);
    setCrossCohortId("");
  }, []);

  const handleCrossCohortChange = useCallback((id: string) => {
    setCrossCohortId(id);
  }, []);

  // Direct cohort selection
  const handleCohortSelect = useCallback((targetCourseId: string, targetCohortId: string) => {
    setCourseId(targetCourseId);
    setCohortId(targetCohortId);
  }, []);

  // Same-cohort warning
  const isSameCohort = compareMode === "cross" && crossCohortId === cohortId;

  return {
    instructorId, courseId, cohortId,
    handleInstructorChange, handleCourseChange, handleCohortChange, handleCohortSelect, handleReset,
    instructors, courses, cohorts, kpis,
    currentKpi, currentCohort,
    sparklines,
    compareMode, handleCompareModeChange,
    baselineCohortId: resolvedBaselineId, handleBaselineChange,
    baselineKpi, baselineCohort, baselineFunnel,
    // Cross-instructor compare
    crossInstructorId, handleCrossInstructorChange,
    crossCourseId, handleCrossCourseChange, crossCourses,
    crossCohortId, handleCrossCohortChange, crossCohorts,
    crossBaselineLabel, isSameCohort,
    funnel, checklist, enrollments,
    loadState, detailLoadState, error,
    triggerRefresh,
  };
}
