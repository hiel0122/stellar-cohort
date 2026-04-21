import type { ScreeningProject, Applicant } from "./types";

const FIRST_NAMES = ["민준", "서연", "도윤", "지유", "예준", "하은", "주원", "수아", "지호", "지민", "현우", "유나", "은우", "다은", "건우"];
const LAST_NAMES = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"];
const BRANDS = ["코지하우스", "스튜디오 마르", "포레스트랩", "비온뒤", "그린테이블", "루미네르", "하루키친", "포포", "바닐라빈", "페이퍼웍스", "오롯", "노블린", "데일리노트", "심플라이프", "온더테이블"];
const AGE_GROUPS = ["20대", "30대", "40대", "50대+"];
const REVENUE = ["<1억", "1-5억", "5-10억", "10억+"];
const BUDGET = ["<300만", "300-500만", "500-1000만", "1000만+"];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pad(n: number, len = 4) { return String(n).padStart(len, "0"); }

function genApplicants(count: number, seed: number): Applicant[] {
  const out: Applicant[] = [];
  for (let i = 0; i < count; i++) {
    const name = `${rand(LAST_NAMES)}${rand(FIRST_NAMES)}`;
    const brand = rand(BRANDS);
    const ageGroup = rand(AGE_GROUPS);
    const revenueBand = rand(REVENUE);
    const budgetBand = rand(BUDGET);
    out.push({
      id: `A-${seed}-${pad(i + 1)}`,
      name,
      phone: `010-${pad(1000 + i * 7 % 9000, 4)}-${pad(2000 + i * 13 % 9000, 4)}`,
      email: i === 3 ? `invalid-email-${i}` : `${brand.toLowerCase().replace(/\s/g, "")}${i}@example.com`,
      brand,
      ageGroup,
      revenueBand,
      budgetBand,
      ownsMall: i % 3 !== 0,
      motivation: ["성장 정체 돌파", "신규 채널 확장", "브랜드 리뉴얼", "팀 빌딩"][i % 4],
      reason: ["구체적 사례", "막연함", "구체적 사례", "구체적 사례"][i % 4],
      topicFit: ["매우 적합", "적합", "보통"][i % 3],
      attendCount: i % 5,
      rawAnswers: {
        "신청 동기": "이번 세미나를 통해 운영 방식을 점검하고 싶습니다.",
        "현재 가장 큰 고민": "재구매율이 떨어지고 있어 콘텐츠 전략을 다시 짜야 합니다.",
        "기대하는 결과물": "실행 가능한 90일 플랜을 가져가고 싶습니다.",
      },
      autoScore: 0,
      manualScore: 0,
      totalScore: 0,
      category: "unclassified",
      status: "unscreened",
    });
  }
  return out;
}

export const MOCK_PROJECTS: ScreeningProject[] = [
  {
    id: "p-seminar-2",
    name: "세미나 2기 모집",
    status: "screening",
    lastUploadAt: "2026-04-18 14:22",
    criteriaVersion: "v2",
    totals: { applicants: 48, priority: 6, selected: 12, reserve: 6 },
    memo: "오프라인 강남 세션. 정원 30명.",
    applicants: genApplicants(48, 1),
    uploads: [
      { id: "u1", filename: "seminar2_apply_0418.xlsx", rows: 48, uploadedAt: "2026-04-18 14:22", uploader: "운영팀" },
      { id: "u2", filename: "seminar2_apply_0410.xlsx", rows: 32, uploadedAt: "2026-04-10 09:11", uploader: "운영팀" },
      { id: "u3", filename: "seminar2_apply_0401.xlsx", rows: 14, uploadedAt: "2026-04-01 17:45", uploader: "운영팀" },
    ],
    criteriaVersions: [
      { id: "cv1", label: "v1", createdAt: "2026-03-21", updatedAt: "2026-03-22", author: "기획팀", active: false, locked: true },
      { id: "cv2", label: "v2", createdAt: "2026-04-02", updatedAt: "2026-04-15", author: "기획팀", active: true, locked: false },
    ],
    snapshots: [
      { id: "s1", label: "snapshot_2026-04-18_1", createdAt: "2026-04-18 16:00", count: 24 },
    ],
    sendLogs: [],
  },
  {
    id: "p-march-free",
    name: "3월 무료강의 선발",
    status: "preparing",
    lastUploadAt: "2026-03-29 10:05",
    criteriaVersion: "v1",
    totals: { applicants: 18, priority: 0, selected: 0, reserve: 0 },
    memo: "온라인 라이브. 정원 100명.",
    applicants: genApplicants(18, 2),
    uploads: [
      { id: "u1", filename: "march_free_0329.csv", rows: 18, uploadedAt: "2026-03-29 10:05", uploader: "운영팀" },
    ],
    criteriaVersions: [
      { id: "cv1", label: "v1", createdAt: "2026-03-15", updatedAt: "2026-03-15", author: "기획팀", active: true, locked: false },
    ],
    snapshots: [],
    sendLogs: [],
  },
  {
    id: "p-partner",
    name: "파트너사 모집 심사",
    status: "confirmed",
    lastUploadAt: "2026-02-12 11:30",
    criteriaVersion: "v3",
    totals: { applicants: 22, priority: 4, selected: 8, reserve: 4 },
    memo: "B2B 파트너 16개사 확정.",
    applicants: genApplicants(22, 3),
    uploads: [
      { id: "u1", filename: "partner_apply_0212.xlsx", rows: 22, uploadedAt: "2026-02-12 11:30", uploader: "기획팀" },
    ],
    criteriaVersions: [
      { id: "cv1", label: "v1", createdAt: "2026-01-10", updatedAt: "2026-01-12", author: "기획팀", active: false, locked: true },
      { id: "cv2", label: "v2", createdAt: "2026-01-25", updatedAt: "2026-02-01", author: "기획팀", active: false, locked: true },
      { id: "cv3", label: "v3", createdAt: "2026-02-10", updatedAt: "2026-02-12", author: "기획팀", active: true, locked: true },
    ],
    snapshots: [
      { id: "s1", label: "snapshot_2026-02-12_1", createdAt: "2026-02-12 18:30", count: 16 },
    ],
    sendLogs: [
      { id: "l1", target: "partner1@example.com", ts: "2026-02-13 09:00", ok: true, message: "delivered" },
      { id: "l2", target: "partner2@example.com", ts: "2026-02-13 09:00", ok: true, message: "delivered" },
      { id: "l3", target: "invalid@@bad", ts: "2026-02-13 09:00", ok: false, message: "invalid recipient" },
    ],
  },
];
