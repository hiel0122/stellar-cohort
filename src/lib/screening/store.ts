import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MOCK_PROJECTS } from "./mockData";
import type { ScreeningProject, Applicant, ApplicantCategory, ApplicantStatus, ProjectStatus } from "./types";

interface ScreeningState {
  projects: ScreeningProject[];
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  updateProject: (id: string, patch: Partial<ScreeningProject>) => void;
  updateApplicant: (projectId: string, applicantId: string, patch: Partial<Applicant>) => void;
  runScreening: (projectId: string) => void;
  toggleApplicantComplete: (projectId: string, applicantId: string) => void;
  addProject: (name: string) => string;
  resetScreening: (projectId: string, opts?: { includeSnapshot?: boolean }) => void;
  confirmSelection: (projectId: string) => void;
}

function scoreApplicant(a: Applicant): { auto: number; breakdown: { label: string; score: number; detail: string }[] } {
  const breakdown: { label: string; score: number; detail: string }[] = [];
  const revMap: Record<string, number> = { "<1억": 5, "1-5억": 12, "5-10억": 17, "10억+": 20 };
  const ageMap: Record<string, number> = { "20대": 6, "30대": 10, "40대": 8, "50대+": 5 };
  const budMap: Record<string, number> = { "<300만": 4, "300-500만": 8, "500-1000만": 12, "1000만+": 15 };
  const fitMap: Record<string, number> = { "매우 적합": 5, "적합": 3, "보통": 1 };
  const reasonMap: Record<string, number> = { "구체적 사례": 11, "막연함": 3 };
  const rev = revMap[a.revenueBand] ?? 0;
  const age = ageMap[a.ageGroup] ?? 0;
  const bud = budMap[a.budgetBand] ?? 0;
  const mall = a.ownsMall ? 10 : 0;
  const fit = fitMap[a.topicFit] ?? 0;
  const reason = reasonMap[a.reason] ?? 5;
  breakdown.push({ label: "매출", score: rev, detail: a.revenueBand });
  breakdown.push({ label: "연령", score: age, detail: a.ageGroup });
  breakdown.push({ label: "예산", score: bud, detail: a.budgetBand });
  breakdown.push({ label: "자사몰", score: mall, detail: a.ownsMall ? "보유" : "없음" });
  breakdown.push({ label: "주제 적합성", score: fit, detail: a.topicFit });
  breakdown.push({ label: "사유 구체성", score: reason, detail: a.reason });
  return { auto: rev + age + bud + mall + fit + reason, breakdown };
}

function classify(applicants: Applicant[]): Applicant[] {
  // sort by total desc
  const sorted = [...applicants].sort((a, b) => b.totalScore - a.totalScore);
  const n = sorted.length;
  const priorityCount = Math.max(1, Math.floor(n * 0.15));
  const selectedCount = Math.max(1, Math.floor(n * 0.3));
  const reserveCount = Math.max(1, Math.floor(n * 0.15));
  const result: Applicant[] = sorted.map((a, idx) => {
    let category: ApplicantCategory;
    if (a.forceExclude) category = "excluded";
    else if (a.forcePriority) category = "priority";
    else if (idx < priorityCount) category = "priority";
    else if (idx < priorityCount + selectedCount) category = "selected";
    else if (idx < priorityCount + selectedCount + reserveCount) category = "reserve";
    else category = "excluded";
    return { ...a, category, status: "screened" as ApplicantStatus };
  });
  // restore original order
  const map = new Map(result.map((a) => [a.id, a]));
  return applicants.map((a) => map.get(a.id)!);
}

export const useScreeningStore = create<ScreeningState>()(
  persist(
    (set, get) => ({
      projects: MOCK_PROJECTS,
      activeProjectId: MOCK_PROJECTS[0].id,
      setActiveProjectId: (id) => set({ activeProjectId: id }),
      updateProject: (id, patch) =>
        set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      updateApplicant: (projectId, applicantId, patch) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id !== projectId
              ? p
              : { ...p, applicants: p.applicants.map((a) => (a.id === applicantId ? { ...a, ...patch } : a)) }
          ),
        })),
      runScreening: (projectId) => {
        const proj = get().projects.find((p) => p.id === projectId);
        if (!proj) return;
        const scored = proj.applicants.map((a) => {
          const { auto, breakdown } = scoreApplicant(a);
          const total = auto + (a.manualScore ?? 0);
          return { ...a, autoScore: auto, totalScore: total, scoreBreakdown: breakdown };
        });
        const classified = classify(scored);
        const totals = {
          applicants: classified.length,
          priority: classified.filter((a) => a.category === "priority").length,
          selected: classified.filter((a) => a.category === "selected").length,
          reserve: classified.filter((a) => a.category === "reserve").length,
        };
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, applicants: classified, totals, status: "screening" as ProjectStatus } : p
          ),
        }));
      },
      toggleApplicantComplete: (projectId, applicantId) => {
        const proj = get().projects.find((p) => p.id === projectId);
        const ap = proj?.applicants.find((a) => a.id === applicantId);
        if (!ap) return;
        const next: ApplicantStatus = ap.status === "confirmed" ? "screened" : "confirmed";
        get().updateApplicant(projectId, applicantId, { status: next });
      },
      addProject: (name) => {
        const id = `p-${Date.now()}`;
        const proj: ScreeningProject = {
          id,
          name: name.trim(),
          status: "preparing",
          lastUploadAt: new Date().toISOString().slice(0, 16).replace("T", " "),
          criteriaVersion: "v1",
          totals: { applicants: 0, priority: 0, selected: 0, reserve: 0 },
          memo: "",
          applicants: [],
          uploads: [],
          criteriaVersions: [
            { id: "cv1", label: "v1", createdAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 10), author: "운영팀", active: true, locked: false },
          ],
          snapshots: [],
          sendLogs: [],
        };
        set((s) => ({ projects: [proj, ...s.projects], activeProjectId: id }));
        return id;
      },
    }),
    {
      name: "seminar-screening-v2",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ projects: s.projects, activeProjectId: s.activeProjectId }),
    }
  )
);
