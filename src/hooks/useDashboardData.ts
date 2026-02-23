import { useState, useEffect, useCallback, useMemo } from "react";
import type { DataProvider } from "@/lib/dataProvider";
import type {
  Instructor, Course, Cohort, CohortKpi,
  FunnelData, ChecklistSummary, Enrollment,
} from "@/lib/types";
import { mockProvider } from "@/lib/providers/mockProvider";

// Switch this single line to swap providers
const provider: DataProvider = mockProvider;

export type LoadState = "idle" | "loading" | "error" | "success";

export function useDashboardData() {
  // Filter state
  const [instructorId, setInstructorId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [cohortId, setCohortId] = useState("");

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
        if (list.length > 0) setInstructorId(list[0].id);
        setLoadState("success");
      })
      .catch((e) => {
        setError(e.message);
        setLoadState("error");
      });
  }, []);

  // When instructor changes → load courses
  useEffect(() => {
    if (!instructorId) return;
    provider.listCourses(instructorId).then((list) => {
      setCourses(list);
      setCourseId(list.length > 0 ? list[0].id : "");
    });
  }, [instructorId]);

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
        // default to latest cohort
        if (cohortList.length > 0) {
          setCohortId(cohortList[cohortList.length - 1].id);
        } else {
          setCohortId("");
        }
        setLoadState("success");
      })
      .catch((e) => {
        setError(e.message);
        setLoadState("error");
      });
  }, [instructorId, courseId]);

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
  }, [cohortId]);

  // Current KPI (latest cohort selected)
  const currentKpi = useMemo(
    () => kpis.find((k) => k.cohort_id === cohortId) ?? null,
    [kpis, cohortId]
  );

  const currentCohort = useMemo(
    () => cohorts.find((c) => c.id === cohortId) ?? null,
    [cohorts, cohortId]
  );

  // Sparkline arrays
  const sparklines = useMemo(() => ({
    revenue: kpis.map((k) => k.revenue),
    students: kpis.map((k) => k.students),
    leads: kpis.map((k) => k.leads),
    conversion: kpis.map((k) => (k.leads > 0 ? (k.students / k.leads) * 100 : 0)),
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
  }, [instructors]);

  return {
    // Filter state
    instructorId, courseId, cohortId,
    handleInstructorChange, handleCourseChange, handleCohortChange, handleReset,
    // Lists
    instructors, courses, cohorts, kpis,
    // Current
    currentKpi, currentCohort,
    sparklines,
    // Detail
    funnel, checklist, enrollments,
    // State
    loadState, detailLoadState, error,
  };
}
