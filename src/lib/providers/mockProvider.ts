import type { DataProvider } from "../dataProvider";
import type {
  Instructor, Course, Cohort, CohortKpi,
  FunnelData, ChecklistSummary, ChecklistItem, Enrollment,
} from "../types";
import { loadRawCohorts, type RawCohort } from "../rawCohortStore";

// ── Build domain objects from raw store ──

function buildAllCohorts(): Cohort[] {
  return loadRawCohorts().map((r) => ({
    id: r.id,
    course_id: `course-${r.course_title}`,
    instructor_id: `inst-${r.instructor_name}`,
    cohort_no: r.cohort_no,
    start_date: r.start_date,
    status: r.status,
    revenue: r.revenue,
    students: r.students,
    leads: r.leads,
    applied: r.applied,
  }));
}

// ── Delta helper ──
function deltaPct(cur: number, prev: number | null): number | null {
  if (prev === null || prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}

// ── Build KPIs ──
function buildKpis(instructorId: string, cId: string): CohortKpi[] {
  const allCohorts = buildAllCohorts();
  const filtered = allCohorts
    .filter((c) => c.instructor_id === instructorId && c.course_id === cId)
    .sort((a, b) => a.cohort_no - b.cohort_no);

  return filtered.map((c, i) => {
    const prev = i > 0 ? filtered[i - 1] : null;
    const conv = c.applied > 0 ? (c.students / c.applied) * 100 : 0;
    const prevConv = prev && prev.applied > 0 ? (prev.students / prev.applied) * 100 : null;
    const convSec = c.leads > 0 ? (c.students / c.leads) * 100 : 0;
    return {
      cohort_id: c.id,
      cohort_no: c.cohort_no,
      course_id: c.course_id,
      instructor_id: c.instructor_id,
      start_date: c.start_date,
      status: c.status,
      revenue: c.revenue,
      students: c.students,
      leads: c.leads,
      applied: c.applied,
      revenue_delta_pct: deltaPct(c.revenue, prev?.revenue ?? null),
      students_delta_pct: deltaPct(c.students, prev?.students ?? null),
      leads_delta_pct: deltaPct(c.leads, prev?.leads ?? null),
      conversion: conv,
      conversion_delta_pct: deltaPct(conv, prevConv),
      conversion_secondary: convSec,
    };
  });
}

// ── Checklist ──
const checklistLabels = [
  "강의자료 업로드", "줌 링크 생성", "공지사항 발송", "출석부 준비",
  "과제 템플릿 작성", "슬랙 채널 개설", "OT 일정 확정", "수료 기준 안내",
  "녹화 설정 확인", "피드백 양식 준비", "수강생 안내 메일 발송",
  "강사료 정산 요청", "수료증 템플릿 준비", "중간 설문 제작",
  "최종 평가 기준 수립", "수강생 포트폴리오 폴더 생성", "멘토링 일정 확정",
  "커뮤니티 가이드 작성", "라이브 세션 리허설", "수강 후기 수집 폼 생성",
  "강의 QnA 게시판 개설", "과제 채점 기준 공유", "출결 인정 기준 안내",
  "보충 강의 일정 수립", "수료식 프로그램 기획", "파트너사 협찬 확인",
  "수강생 네트워킹 행사 기획", "강의 피드백 분석 리포트", "차기 기수 모집 페이지 오픈",
  "수강생 커리어 상담 예약", "강의 콘텐츠 백업", "수강생 만족도 조사",
  "인스타그램 후기 수집", "유튜브 하이라이트 편집", "블로그 후기 작성 요청",
  "강의 개선 사항 정리", "외부 강연 스케줄 확인", "교재 업데이트 검토",
  "시스템 점검 및 백업", "최종 결산 보고서 작성",
];

function buildChecklist(cId: string): ChecklistSummary {
  const allCohorts = buildAllCohorts();
  const cohort = allCohorts.find((c) => c.id === cId);
  if (!cohort) return { total: 0, done: 0, items: [] };

  const total = 40;
  let done: number;
  if (cohort.status === "closed") {
    done = 40;
  } else {
    done = Math.min(total, 18 + ((cohort.cohort_no * 7) % 13));
  }

  const items: ChecklistItem[] = checklistLabels.map((label, i) => ({
    id: `${cId}-cl-${i}`,
    label,
    is_done: i < done,
    assignee: i % 4 === 0 ? "관리자" : i % 4 === 1 ? "강사" : i % 4 === 2 ? "운영팀" : null,
  }));

  return { total, done, items };
}

// ── Enrollments ──
const maskedNames = [
  "김*수", "이*영", "박*진", "최*희", "정*호",
  "강*미", "조*현", "윤*서", "임*준", "한*린",
];

function buildEnrollments(cId: string): Enrollment[] {
  const allCohorts = buildAllCohorts();
  const cohort = allCohorts.find((c) => c.id === cId);
  if (!cohort || cohort.students === 0) return [];

  const perStudent = Math.round(cohort.revenue / cohort.students);
  const count = Math.min(cohort.students, 10);

  return Array.from({ length: count }, (_, i) => {
    const dayOffset = i * 2 + 1;
    const baseDate = new Date(cohort.start_date ?? "2026-01-01");
    baseDate.setDate(baseDate.getDate() - dayOffset);
    const jitter = Math.round(perStudent * (0.95 + (((i * 7 + 3) % 11) / 110)));

    return {
      id: `${cId}-enr-${i}`,
      cohort_id: cId,
      student_name: maskedNames[i % maskedNames.length],
      student_email: `user${String(i + 1).padStart(3, "0")}***@example.com`,
      paid_amount: jitter,
      refunded_amount: 0,
      paid_at: baseDate.toISOString().slice(0, 10),
    };
  });
}

// ── Simulate async ──
const delay = (ms = 80) => new Promise((r) => setTimeout(r, ms));

// ── Provider ──
export const mockProvider: DataProvider = {
  async listInstructors() {
    await delay();
    const raw = loadRawCohorts();
    const names = [...new Set(raw.map((r) => r.instructor_name))];
    return names.map((name) => ({ id: `inst-${name}`, name }));
  },

  async listCourses(instructorId: string) {
    await delay();
    const instName = instructorId.replace("inst-", "");
    const raw = loadRawCohorts();
    const titles = [...new Set(raw.filter((r) => r.instructor_name === instName).map((r) => r.course_title))];
    return titles.map((t) => ({ id: `course-${t}`, title: t }));
  },

  async listCohorts(instructorId: string, cId: string) {
    await delay();
    return buildAllCohorts()
      .filter((c) => c.instructor_id === instructorId && c.course_id === cId)
      .sort((a, b) => a.cohort_no - b.cohort_no);
  },

  async getCohortKpis(instructorId: string, cId: string) {
    await delay();
    return buildKpis(instructorId, cId);
  },

  async getFunnel(cohortId: string) {
    await delay();
    const allCohorts = buildAllCohorts();
    const cohort = allCohorts.find((c) => c.id === cohortId);
    if (!cohort) return { lead: 0, applied: 0, paid: 0 };
    return { lead: cohort.leads, applied: cohort.applied, paid: cohort.students };
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
