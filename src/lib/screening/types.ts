export type ProjectStatus = "preparing" | "screening" | "confirmed" | "sending" | "closed";

export type ApplicantCategory = "priority" | "selected" | "reserve" | "excluded" | "unclassified";
export type ApplicantStatus = "unscreened" | "screened" | "needs_review" | "confirmed";

export interface Applicant {
  id: string;
  name: string;
  phone: string;
  email: string;
  brand: string;
  ageGroup: string; // 20s/30s/40s/50s+
  revenueBand: string; // <1억 / 1-5억 / 5-10억 / 10억+
  budgetBand: string;
  ownsMall: boolean;
  motivation: string;
  reason: string;
  topicFit: string;
  attendCount: number;
  rawAnswers: Record<string, string>;
  autoScore: number;
  manualScore: number;
  totalScore: number;
  category: ApplicantCategory;
  status: ApplicantStatus;
  forcePriority?: boolean;
  forceExclude?: boolean;
  memo?: string;
  scoreBreakdown?: { label: string; score: number; detail: string }[];
  history?: { ts: string; msg: string }[];
}

export interface UploadHistory {
  id: string;
  filename: string;
  rows: number;
  uploadedAt: string;
  uploader: string;
}

export interface CriteriaVersion {
  id: string;
  label: string; // v1, v2
  createdAt: string;
  updatedAt: string;
  author: string;
  active: boolean;
  locked: boolean;
}

export type AuditStatus = "ready" | "in_progress" | "completed" | "revoked";

export interface ConfirmSnapshot {
  id: string;
  label: string;
  createdAt: string;
  count: number;
  status?: "active" | "revoked";
  rows?: { applicantId: string; category: ApplicantCategory; totalScore: number }[];
}

export interface SendLog {
  id: string;
  target: string;
  ts: string;
  ok: boolean;
  message: string;
}

export interface ScreeningProject {
  id: string;
  name: string;
  status: ProjectStatus;
  auditStatus?: AuditStatus;
  lastUploadAt: string;
  criteriaVersion: string;
  totals: { applicants: number; priority: number; selected: number; reserve: number };
  memo: string;
  applicants: Applicant[];
  uploads: UploadHistory[];
  criteriaVersions: CriteriaVersion[];
  snapshots: ConfirmSnapshot[];
  sendLogs: SendLog[];
}

export const AUDIT_STATUS_LABEL: Record<AuditStatus, string> = {
  ready: "준비",
  in_progress: "심사중",
  completed: "심사 완료",
  revoked: "확정 취소",
};

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  preparing: "준비중",
  screening: "심사중",
  confirmed: "확정",
  sending: "메일발송중",
  closed: "종료",
};

export const CATEGORY_LABEL: Record<ApplicantCategory, string> = {
  priority: "우선선발",
  selected: "선발",
  reserve: "예비선발",
  excluded: "제외",
  unclassified: "미분류",
};

export const APPLICANT_STATUS_LABEL: Record<ApplicantStatus, string> = {
  unscreened: "미심사",
  screened: "심사완료",
  needs_review: "수동검토필요",
  confirmed: "확정완료",
};
