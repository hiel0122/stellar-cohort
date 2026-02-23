import type { DataProvider } from "../dataProvider";
import type {
  Instructor, Course, Cohort, CohortKpi,
  FunnelData, ChecklistSummary, ChecklistItem, Enrollment,
} from "../types";

// ── Instructors ──
const instructors: Instructor[] = [
  { id: "inst-1", name: "김민수", email: "minsu@example.com" },
  { id: "inst-2", name: "이지은", email: "jieun@example.com" },
  { id: "inst-3", name: "박준호", email: "junho@example.com" },
];

// ── Courses ──
const courses: Course[] = [
  { id: "course-1", title: "풀스택 웹 개발 부트캠프", description: "React + Node.js 풀스택 과정" },
  { id: "course-2", title: "데이터 분석 입문", description: "Python 기반 데이터 분석" },
  { id: "course-3", title: "UX/UI 디자인 마스터", description: "피그마 기반 디자인 과정" },
  { id: "course-4", title: "AI/ML 실전 프로젝트", description: "PyTorch 기반 딥러닝 실습" },
];

// instructor → course mapping
const instructorCourses: Record<string, string[]> = {
  "inst-1": ["course-1", "course-2"],
  "inst-2": ["course-3", "course-4"],
  "inst-3": ["course-1", "course-4"],
};

// ── Cohorts ──
const cohorts: Cohort[] = [
  // inst-1 / course-1 (5 cohorts)
  { id: "coh-1",  course_id: "course-1", instructor_id: "inst-1", cohort_no: 1, start_date: "2024-01-15", end_date: "2024-04-15", status: "closed", price: 2500000 },
  { id: "coh-2",  course_id: "course-1", instructor_id: "inst-1", cohort_no: 2, start_date: "2024-05-01", end_date: "2024-08-01", status: "closed", price: 2700000 },
  { id: "coh-3",  course_id: "course-1", instructor_id: "inst-1", cohort_no: 3, start_date: "2024-09-01", end_date: "2024-12-01", status: "closed", price: 2800000 },
  { id: "coh-4",  course_id: "course-1", instructor_id: "inst-1", cohort_no: 4, start_date: "2025-01-10", end_date: "2025-04-10", status: "active", price: 2900000 },
  { id: "coh-5",  course_id: "course-1", instructor_id: "inst-1", cohort_no: 5, start_date: "2025-05-01", end_date: "2025-08-01", status: "planned", price: 3000000 },
  // inst-1 / course-2 (3 cohorts)
  { id: "coh-6",  course_id: "course-2", instructor_id: "inst-1", cohort_no: 1, start_date: "2024-03-01", end_date: "2024-05-30", status: "closed", price: 1800000 },
  { id: "coh-7",  course_id: "course-2", instructor_id: "inst-1", cohort_no: 2, start_date: "2024-07-01", end_date: "2024-09-30", status: "closed", price: 1900000 },
  { id: "coh-8",  course_id: "course-2", instructor_id: "inst-1", cohort_no: 3, start_date: "2024-11-01", end_date: "2025-01-31", status: "active", price: 2000000 },
  // inst-2 / course-3 (4 cohorts)
  { id: "coh-9",  course_id: "course-3", instructor_id: "inst-2", cohort_no: 1, start_date: "2024-02-01", end_date: "2024-05-01", status: "closed", price: 2200000 },
  { id: "coh-10", course_id: "course-3", instructor_id: "inst-2", cohort_no: 2, start_date: "2024-06-01", end_date: "2024-09-01", status: "closed", price: 2400000 },
  { id: "coh-11", course_id: "course-3", instructor_id: "inst-2", cohort_no: 3, start_date: "2024-10-01", end_date: "2025-01-01", status: "closed", price: 2500000 },
  { id: "coh-12", course_id: "course-3", instructor_id: "inst-2", cohort_no: 4, start_date: "2025-02-01", end_date: "2025-05-01", status: "active", price: 2600000 },
  // inst-2 / course-4 (3 cohorts)
  { id: "coh-13", course_id: "course-4", instructor_id: "inst-2", cohort_no: 1, start_date: "2024-04-01", end_date: "2024-07-01", status: "closed", price: 3200000 },
  { id: "coh-14", course_id: "course-4", instructor_id: "inst-2", cohort_no: 2, start_date: "2024-08-01", end_date: "2024-11-01", status: "closed", price: 3400000 },
  { id: "coh-15", course_id: "course-4", instructor_id: "inst-2", cohort_no: 3, start_date: "2025-01-01", end_date: "2025-04-01", status: "active", price: 3500000 },
  // inst-3 / course-1 (3 cohorts)
  { id: "coh-16", course_id: "course-1", instructor_id: "inst-3", cohort_no: 1, start_date: "2024-04-01", end_date: "2024-07-01", status: "closed", price: 2600000 },
  { id: "coh-17", course_id: "course-1", instructor_id: "inst-3", cohort_no: 2, start_date: "2024-08-01", end_date: "2024-11-01", status: "closed", price: 2800000 },
  { id: "coh-18", course_id: "course-1", instructor_id: "inst-3", cohort_no: 3, start_date: "2025-01-15", end_date: "2025-04-15", status: "active", price: 2900000 },
  // inst-3 / course-4 (3 cohorts)
  { id: "coh-19", course_id: "course-4", instructor_id: "inst-3", cohort_no: 1, start_date: "2024-05-01", end_date: "2024-08-01", status: "closed", price: 3100000 },
  { id: "coh-20", course_id: "course-4", instructor_id: "inst-3", cohort_no: 2, start_date: "2024-10-01", end_date: "2025-01-01", status: "active", price: 3300000 },
];

// ── KPI seed data (keyed by cohort id) ──
interface KpiSeed {
  revenue: number;
  students: number;
  leads: number;
  youtube_denominator_est: number | null;
  funnel_applied: number;
}

const kpiSeed: Record<string, KpiSeed> = {
  "coh-1":  { revenue: 70000000,  students: 28, leads: 45, funnel_applied: 36, youtube_denominator_est: null },
  "coh-2":  { revenue: 94500000,  students: 35, leads: 60, funnel_applied: 47, youtube_denominator_est: null },
  "coh-3":  { revenue: 112000000, students: 40, leads: 72, funnel_applied: 55, youtube_denominator_est: 850 },
  "coh-4":  { revenue: 116000000, students: 40, leads: 68, funnel_applied: 52, youtube_denominator_est: 920 },
  "coh-5":  { revenue: 0,         students: 0,  leads: 15, funnel_applied: 3,  youtube_denominator_est: null },
  "coh-6":  { revenue: 30600000,  students: 17, leads: 30, funnel_applied: 22, youtube_denominator_est: null },
  "coh-7":  { revenue: 39900000,  students: 21, leads: 40, funnel_applied: 29, youtube_denominator_est: 420 },
  "coh-8":  { revenue: 42000000,  students: 21, leads: 38, funnel_applied: 28, youtube_denominator_est: 480 },
  "coh-9":  { revenue: 39600000,  students: 18, leads: 35, funnel_applied: 26, youtube_denominator_est: null },
  "coh-10": { revenue: 67200000,  students: 28, leads: 50, funnel_applied: 38, youtube_denominator_est: null },
  "coh-11": { revenue: 72500000,  students: 29, leads: 48, funnel_applied: 37, youtube_denominator_est: 610 },
  "coh-12": { revenue: 78000000,  students: 30, leads: 55, funnel_applied: 42, youtube_denominator_est: 700 },
  "coh-13": { revenue: 89600000,  students: 28, leads: 42, funnel_applied: 34, youtube_denominator_est: null },
  "coh-14": { revenue: 102000000, students: 30, leads: 48, funnel_applied: 38, youtube_denominator_est: 780 },
  "coh-15": { revenue: 105000000, students: 30, leads: 52, funnel_applied: 40, youtube_denominator_est: 850 },
  "coh-16": { revenue: 54600000,  students: 21, leads: 38, funnel_applied: 28, youtube_denominator_est: null },
  "coh-17": { revenue: 72800000,  students: 26, leads: 45, funnel_applied: 34, youtube_denominator_est: 560 },
  "coh-18": { revenue: 81200000,  students: 28, leads: 50, funnel_applied: 38, youtube_denominator_est: 650 },
  "coh-19": { revenue: 68200000,  students: 22, leads: 40, funnel_applied: 30, youtube_denominator_est: null },
  "coh-20": { revenue: 82500000,  students: 25, leads: 46, funnel_applied: 36, youtube_denominator_est: 720 },
};

// ── Checklist seeds ──
const checklistLabels = [
  "강의자료 업로드", "줌 링크 생성", "공지사항 발송", "출석부 준비",
  "과제 템플릿 작성", "슬랙 채널 개설", "OT 일정 확정", "수료 기준 안내",
  "녹화 설정 확인", "피드백 양식 준비",
];

function buildChecklist(cohortId: string): ChecklistSummary {
  const seed = kpiSeed[cohortId];
  if (!seed) return { total: 0, done: 0, items: [] };
  // deterministic pseudo-random based on cohort index
  const idx = parseInt(cohortId.replace("coh-", ""), 10);
  const total = 10;
  const done = Math.min(total, Math.max(0, (idx * 3 + 2) % (total + 1)));
  const items: ChecklistItem[] = checklistLabels.map((label, i) => ({
    id: `${cohortId}-cl-${i}`,
    label,
    is_done: i < done,
    assignee: i % 3 === 0 ? "관리자" : i % 3 === 1 ? "강사" : null,
  }));
  return { total, done, items };
}

// ── Enrollment seeds ──
function buildEnrollments(cohortId: string): Enrollment[] {
  const seed = kpiSeed[cohortId];
  if (!seed || seed.students === 0) return [];
  const cohort = cohorts.find((c) => c.id === cohortId);
  return Array.from({ length: seed.students }, (_, i) => ({
    id: `${cohortId}-enr-${i}`,
    cohort_id: cohortId,
    student_name: `수강생${String(i + 1).padStart(2, "0")}`,
    student_email: `student${i + 1}@example.com`,
    paid_amount: cohort?.price ?? 0,
    refunded_amount: i < Math.floor(seed.students * 0.05) ? (cohort?.price ?? 0) : 0,
    paid_at: cohort?.start_date ?? null,
  }));
}

// ── Helper: compute delta % ──
function deltaPct(current: number, previous: number | null): number | null {
  if (previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

// ── Build KPIs for a course-instructor pair ──
function buildKpis(instructorId: string, courseId: string): CohortKpi[] {
  const filtered = cohorts
    .filter((c) => c.instructor_id === instructorId && c.course_id === courseId)
    .sort((a, b) => a.cohort_no - b.cohort_no);

  return filtered.map((c, i) => {
    const seed = kpiSeed[c.id]!;
    const prev = i > 0 ? kpiSeed[filtered[i - 1].id]! : null;
    const convEst = seed.youtube_denominator_est
      ? (seed.students / seed.youtube_denominator_est) * 100
      : null;
    const prevConvEst =
      prev && prev.youtube_denominator_est
        ? (prev.students / prev.youtube_denominator_est) * 100
        : null;
    return {
      cohort_id: c.id,
      cohort_no: c.cohort_no,
      course_id: c.course_id,
      instructor_id: c.instructor_id,
      start_date: c.start_date,
      end_date: c.end_date,
      status: c.status,
      revenue: seed.revenue,
      students: seed.students,
      leads: seed.leads,
      revenue_delta_pct: deltaPct(seed.revenue, prev?.revenue ?? null),
      students_delta_pct: deltaPct(seed.students, prev?.students ?? null),
      leads_delta_pct: deltaPct(seed.leads, prev?.leads ?? null),
      youtube_denominator_est: seed.youtube_denominator_est,
      youtube_conversion_est: convEst,
      youtube_conversion_delta_pct: deltaPct(convEst ?? 0, prevConvEst),
    };
  });
}

// Simulate async delay
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

export const mockProvider: DataProvider = {
  async listInstructors() {
    await delay();
    return instructors;
  },

  async listCourses(instructorId: string) {
    await delay();
    const ids = instructorCourses[instructorId] ?? [];
    return courses.filter((c) => ids.includes(c.id));
  },

  async listCohorts(instructorId: string, courseId: string) {
    await delay();
    return cohorts
      .filter((c) => c.instructor_id === instructorId && c.course_id === courseId)
      .sort((a, b) => a.cohort_no - b.cohort_no);
  },

  async getCohortKpis(instructorId: string, courseId: string) {
    await delay();
    return buildKpis(instructorId, courseId);
  },

  async getFunnel(cohortId: string) {
    await delay();
    const seed = kpiSeed[cohortId];
    if (!seed) return { lead: 0, applied: 0, paid: 0 };
    return { lead: seed.leads, applied: seed.funnel_applied, paid: seed.students };
  },

  async getChecklist(cohortId: string) {
    await delay();
    return buildChecklist(cohortId);
  },

  async getRecentEnrollments(cohortId: string, limit = 10) {
    await delay();
    return buildEnrollments(cohortId).slice(0, limit);
  },
};
