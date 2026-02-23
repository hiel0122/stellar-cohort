export interface Instructor {
  id: string;
  name: string;
  email: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
}

export interface Cohort {
  id: string;
  course_id: string;
  instructor_id: string;
  cohort_no: number;
  start_date: string;
  end_date: string;
  status: "planned" | "active" | "closed";
  price: number;
}

export interface Lead {
  id: string;
  cohort_id: string;
  source: string;
  stage: "lead" | "applied" | "paid";
}

export interface Enrollment {
  id: string;
  cohort_id: string;
  student_name: string;
  student_email: string;
  paid_amount: number;
  refunded_amount: number;
  paid_at: string;
}

export const instructors: Instructor[] = [
  { id: "inst-1", name: "김민수", email: "minsu@example.com" },
  { id: "inst-2", name: "이지은", email: "jieun@example.com" },
  { id: "inst-3", name: "박준호", email: "junho@example.com" },
];

export const courses: Course[] = [
  { id: "course-1", title: "풀스택 웹 개발 부트캠프", description: "React + Node.js 풀스택 과정" },
  { id: "course-2", title: "데이터 분석 입문", description: "Python 기반 데이터 분석" },
  { id: "course-3", title: "UX/UI 디자인 마스터", description: "피그마 기반 디자인 과정" },
];

export const cohorts: Cohort[] = [
  // 김민수 - 풀스택
  { id: "coh-1", course_id: "course-1", instructor_id: "inst-1", cohort_no: 1, start_date: "2024-01-15", end_date: "2024-04-15", status: "closed", price: 2500000 },
  { id: "coh-2", course_id: "course-1", instructor_id: "inst-1", cohort_no: 2, start_date: "2024-05-01", end_date: "2024-08-01", status: "closed", price: 2700000 },
  { id: "coh-3", course_id: "course-1", instructor_id: "inst-1", cohort_no: 3, start_date: "2024-09-01", end_date: "2024-12-01", status: "active", price: 2900000 },
  // 김민수 - 데이터분석
  { id: "coh-4", course_id: "course-2", instructor_id: "inst-1", cohort_no: 1, start_date: "2024-03-01", end_date: "2024-05-30", status: "closed", price: 1800000 },
  { id: "coh-5", course_id: "course-2", instructor_id: "inst-1", cohort_no: 2, start_date: "2024-07-01", end_date: "2024-09-30", status: "active", price: 1900000 },
  // 이지은 - UX/UI
  { id: "coh-6", course_id: "course-3", instructor_id: "inst-2", cohort_no: 1, start_date: "2024-02-01", end_date: "2024-05-01", status: "closed", price: 2200000 },
  { id: "coh-7", course_id: "course-3", instructor_id: "inst-2", cohort_no: 2, start_date: "2024-06-01", end_date: "2024-09-01", status: "closed", price: 2400000 },
  { id: "coh-8", course_id: "course-3", instructor_id: "inst-2", cohort_no: 3, start_date: "2024-10-01", end_date: "2025-01-01", status: "active", price: 2500000 },
  // 박준호 - 풀스택
  { id: "coh-9", course_id: "course-1", instructor_id: "inst-3", cohort_no: 1, start_date: "2024-04-01", end_date: "2024-07-01", status: "closed", price: 2600000 },
  { id: "coh-10", course_id: "course-1", instructor_id: "inst-3", cohort_no: 2, start_date: "2024-08-01", end_date: "2024-11-01", status: "active", price: 2800000 },
];

export const leads: Lead[] = [
  // coh-1: 45 leads
  ...Array.from({ length: 45 }, (_, i) => ({ id: `lead-1-${i}`, cohort_id: "coh-1", source: ["organic", "ad", "referral"][i % 3], stage: (i < 30 ? "paid" : i < 38 ? "applied" : "lead") as Lead["stage"] })),
  // coh-2: 60 leads
  ...Array.from({ length: 60 }, (_, i) => ({ id: `lead-2-${i}`, cohort_id: "coh-2", source: ["organic", "ad", "referral"][i % 3], stage: (i < 38 ? "paid" : i < 48 ? "applied" : "lead") as Lead["stage"] })),
  // coh-3: 72 leads
  ...Array.from({ length: 72 }, (_, i) => ({ id: `lead-3-${i}`, cohort_id: "coh-3", source: ["organic", "ad", "referral"][i % 3], stage: (i < 42 ? "paid" : i < 56 ? "applied" : "lead") as Lead["stage"] })),
  // coh-4: 30 leads
  ...Array.from({ length: 30 }, (_, i) => ({ id: `lead-4-${i}`, cohort_id: "coh-4", source: ["organic", "ad"][i % 2], stage: (i < 18 ? "paid" : i < 24 ? "applied" : "lead") as Lead["stage"] })),
  // coh-5: 40 leads
  ...Array.from({ length: 40 }, (_, i) => ({ id: `lead-5-${i}`, cohort_id: "coh-5", source: ["organic", "ad"][i % 2], stage: (i < 22 ? "paid" : i < 30 ? "applied" : "lead") as Lead["stage"] })),
  // coh-6: 35
  ...Array.from({ length: 35 }, (_, i) => ({ id: `lead-6-${i}`, cohort_id: "coh-6", source: "organic", stage: (i < 20 ? "paid" : i < 28 ? "applied" : "lead") as Lead["stage"] })),
  // coh-7: 50
  ...Array.from({ length: 50 }, (_, i) => ({ id: `lead-7-${i}`, cohort_id: "coh-7", source: ["organic", "ad"][i % 2], stage: (i < 30 ? "paid" : i < 40 ? "applied" : "lead") as Lead["stage"] })),
  // coh-8: 55
  ...Array.from({ length: 55 }, (_, i) => ({ id: `lead-8-${i}`, cohort_id: "coh-8", source: ["organic", "ad", "referral"][i % 3], stage: (i < 32 ? "paid" : i < 44 ? "applied" : "lead") as Lead["stage"] })),
  // coh-9: 38
  ...Array.from({ length: 38 }, (_, i) => ({ id: `lead-9-${i}`, cohort_id: "coh-9", source: "ad", stage: (i < 22 ? "paid" : i < 30 ? "applied" : "lead") as Lead["stage"] })),
  // coh-10: 48
  ...Array.from({ length: 48 }, (_, i) => ({ id: `lead-10-${i}`, cohort_id: "coh-10", source: ["organic", "ad"][i % 2], stage: (i < 28 ? "paid" : i < 38 ? "applied" : "lead") as Lead["stage"] })),
];

export const enrollments: Enrollment[] = [
  // coh-1: 30 students, price ~2.5M
  ...Array.from({ length: 30 }, (_, i) => ({ id: `enr-1-${i}`, cohort_id: "coh-1", student_name: `학생 1-${i + 1}`, student_email: `s1-${i}@test.com`, paid_amount: 2500000, refunded_amount: i < 2 ? 2500000 : 0, paid_at: "2024-01-10" })),
  // coh-2: 38 students
  ...Array.from({ length: 38 }, (_, i) => ({ id: `enr-2-${i}`, cohort_id: "coh-2", student_name: `학생 2-${i + 1}`, student_email: `s2-${i}@test.com`, paid_amount: 2700000, refunded_amount: i < 3 ? 2700000 : 0, paid_at: "2024-04-25" })),
  // coh-3: 42 students
  ...Array.from({ length: 42 }, (_, i) => ({ id: `enr-3-${i}`, cohort_id: "coh-3", student_name: `학생 3-${i + 1}`, student_email: `s3-${i}@test.com`, paid_amount: 2900000, refunded_amount: i < 2 ? 2900000 : 0, paid_at: "2024-08-25" })),
  // coh-4: 18
  ...Array.from({ length: 18 }, (_, i) => ({ id: `enr-4-${i}`, cohort_id: "coh-4", student_name: `학생 4-${i + 1}`, student_email: `s4-${i}@test.com`, paid_amount: 1800000, refunded_amount: i < 1 ? 1800000 : 0, paid_at: "2024-02-20" })),
  // coh-5: 22
  ...Array.from({ length: 22 }, (_, i) => ({ id: `enr-5-${i}`, cohort_id: "coh-5", student_name: `학생 5-${i + 1}`, student_email: `s5-${i}@test.com`, paid_amount: 1900000, refunded_amount: i < 1 ? 1900000 : 0, paid_at: "2024-06-20" })),
  // coh-6: 20
  ...Array.from({ length: 20 }, (_, i) => ({ id: `enr-6-${i}`, cohort_id: "coh-6", student_name: `학생 6-${i + 1}`, student_email: `s6-${i}@test.com`, paid_amount: 2200000, refunded_amount: i < 2 ? 2200000 : 0, paid_at: "2024-01-25" })),
  // coh-7: 30
  ...Array.from({ length: 30 }, (_, i) => ({ id: `enr-7-${i}`, cohort_id: "coh-7", student_name: `학생 7-${i + 1}`, student_email: `s7-${i}@test.com`, paid_amount: 2400000, refunded_amount: i < 2 ? 2400000 : 0, paid_at: "2024-05-25" })),
  // coh-8: 32
  ...Array.from({ length: 32 }, (_, i) => ({ id: `enr-8-${i}`, cohort_id: "coh-8", student_name: `학생 8-${i + 1}`, student_email: `s8-${i}@test.com`, paid_amount: 2500000, refunded_amount: i < 1 ? 2500000 : 0, paid_at: "2024-09-25" })),
  // coh-9: 22
  ...Array.from({ length: 22 }, (_, i) => ({ id: `enr-9-${i}`, cohort_id: "coh-9", student_name: `학생 9-${i + 1}`, student_email: `s9-${i}@test.com`, paid_amount: 2600000, refunded_amount: i < 1 ? 2600000 : 0, paid_at: "2024-03-25" })),
  // coh-10: 28
  ...Array.from({ length: 28 }, (_, i) => ({ id: `enr-10-${i}`, cohort_id: "coh-10", student_name: `학생 10-${i + 1}`, student_email: `s10-${i}@test.com`, paid_amount: 2800000, refunded_amount: i < 2 ? 2800000 : 0, paid_at: "2024-07-25" })),
];

// KPI calculation helpers
export function getRevenue(cohortId: string): number {
  return enrollments
    .filter((e) => e.cohort_id === cohortId)
    .reduce((sum, e) => sum + e.paid_amount - e.refunded_amount, 0);
}

export function getStudents(cohortId: string): number {
  return enrollments.filter(
    (e) => e.cohort_id === cohortId && e.paid_amount - e.refunded_amount > 0
  ).length;
}

export function getLeadCount(cohortId: string): number {
  return leads.filter((l) => l.cohort_id === cohortId).length;
}

export function getConversionRate(cohortId: string): number {
  const leadCount = getLeadCount(cohortId);
  if (leadCount === 0) return 0;
  return (getStudents(cohortId) / leadCount) * 100;
}

export function getPreviousCohort(cohort: Cohort): Cohort | null {
  const siblings = cohorts
    .filter(
      (c) =>
        c.instructor_id === cohort.instructor_id &&
        c.course_id === cohort.course_id &&
        c.cohort_no < cohort.cohort_no
    )
    .sort((a, b) => b.cohort_no - a.cohort_no);
  return siblings[0] || null;
}

export function getDeltaPct(current: number, previous: number | null): number | null {
  if (previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function getCohortsForInstructorCourse(instructorId: string, courseId: string): Cohort[] {
  return cohorts
    .filter((c) => c.instructor_id === instructorId && c.course_id === courseId)
    .sort((a, b) => a.cohort_no - b.cohort_no);
}

export function getCoursesForInstructor(instructorId: string): Course[] {
  const courseIds = [...new Set(cohorts.filter((c) => c.instructor_id === instructorId).map((c) => c.course_id))];
  return courses.filter((c) => courseIds.includes(c.id));
}

export function getFunnelData(cohortId: string) {
  const cohortLeads = leads.filter((l) => l.cohort_id === cohortId);
  return {
    lead: cohortLeads.length,
    applied: cohortLeads.filter((l) => l.stage === "applied" || l.stage === "paid").length,
    paid: cohortLeads.filter((l) => l.stage === "paid").length,
  };
}
