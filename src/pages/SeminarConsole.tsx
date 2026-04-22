import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { SectionCard } from "@/components/seminar/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useScreeningStore } from "@/lib/screening/store";
import { CATEGORY_LABEL, APPLICANT_STATUS_LABEL, STATUS_LABEL, AUDIT_STATUS_LABEL, type ApplicantCategory, type ApplicantStatus, type ProjectStatus, type AuditStatus, type Applicant, type ScreeningProject } from "@/lib/screening/types";
import { Search, Play, RotateCcw, Plus, StickyNote, CheckCircle2, Eye } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_PRIORITY: Record<ApplicantCategory, number> = {
  priority: 0,
  selected: 1,
  reserve: 2,
  excluded: 3,
  unclassified: 4,
};

type SortKey = "category" | "score_desc" | "score_asc" | "id";

const COL_WIDTHS = {
  check: 44, id: 90, name: 90, phone: 140, email: 220, brand: 160,
  age: 80, rev: 110, bud: 110, attend: 70, auto: 70, manual: 70,
  total: 70, category: 130, status: 110, memo: 36,
} as const;

const STATUS_VARIANT: Record<ProjectStatus, string> = {
  preparing: "bg-muted text-muted-foreground",
  screening: "bg-primary/10 text-primary border-primary/20",
  confirmed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  sending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  closed: "bg-muted text-muted-foreground",
};

const AUDIT_VARIANT: Record<AuditStatus, string> = {
  ready: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  revoked: "bg-muted text-muted-foreground",
};

/** Returns the badge label/className that should appear in cards & headers.
 *  auditStatus takes precedence (심사 완료 표시 우선) over the operational status. */
function getDisplayBadge(p: ScreeningProject): { label: string; cls: string } {
  if (p.auditStatus === "completed") {
    return { label: AUDIT_STATUS_LABEL.completed, cls: AUDIT_VARIANT.completed };
  }
  return { label: STATUS_LABEL[p.status], cls: STATUS_VARIANT[p.status] };
}

const CATEGORY_VARIANT: Record<ApplicantCategory, string> = {
  priority: "bg-primary/10 text-primary border-primary/20",
  selected: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  reserve: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  excluded: "bg-destructive/10 text-destructive border-destructive/20",
  unclassified: "bg-muted text-muted-foreground",
};

export default function SeminarConsolePage() {
  const { projects, activeProjectId, setActiveProjectId, runScreening, updateApplicant, addProject, updateProject } = useScreeningStore();
  const active = projects.find((p) => p.id === activeProjectId) ?? projects[0];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);

  // Applicant table filters
  const [appSearchInput, setAppSearchInput] = useState("");
  const [appSearch, setAppSearch] = useState("");
  const [catFilter, setCatFilter] = useState<ApplicantCategory | "all">("all");
  const [appStatusFilter, setAppStatusFilter] = useState<ApplicantStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("category");
  const [dirty, setDirty] = useState(false);
  const [confirmPriority, setConfirmPriority] = useState<{ id: string } | null>(null);

  // Debounce search 300ms
  useEffect(() => {
    const t = setTimeout(() => setAppSearch(appSearchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [appSearchInput]);

  const filteredProjects = projects.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  const selectedApp = active?.applicants.find((a) => a.id === selectedAppId) ?? null;

  const filteredApplicants = useMemo(() => {
    if (!active) return [];
    const list = active.applicants.filter((a) => {
      if (catFilter !== "all" && a.category !== catFilter) return false;
      if (appStatusFilter !== "all" && a.status !== appStatusFilter) return false;
      if (appSearch) {
        const phoneNorm = a.phone.replace(/[^0-9]/g, "");
        const hay = [a.name, a.email, a.phone, phoneNorm, a.brand, a.id].join(" ").toLowerCase();
        if (!hay.includes(appSearch)) return false;
      }
      return true;
    });
    const sorted = [...list];
    if (sortKey === "category") {
      sorted.sort((a, b) => CATEGORY_PRIORITY[a.category] - CATEGORY_PRIORITY[b.category] || b.totalScore - a.totalScore);
    } else if (sortKey === "score_desc") {
      sorted.sort((a, b) => b.totalScore - a.totalScore);
    } else if (sortKey === "score_asc") {
      sorted.sort((a, b) => a.totalScore - b.totalScore);
    } else {
      sorted.sort((a, b) => a.id.localeCompare(b.id));
    }
    return sorted;
  }, [active, catFilter, appStatusFilter, appSearch, sortKey]);

  function handleCategoryChange(applicantId: string, next: ApplicantCategory) {
    if (!active) return;
    if (next === "priority") {
      setConfirmPriority({ id: applicantId });
      return;
    }
    updateApplicant(active.id, applicantId, { category: next });
    setDirty(true);
  }
  function confirmPriorityChange() {
    if (!active || !confirmPriority) return;
    updateApplicant(active.id, confirmPriority.id, { category: "priority" });
    setDirty(true);
    setConfirmPriority(null);
  }

  function handleRun() {
    if (!active) return;
    runScreening(active.id);
    setLastRunAt(new Date().toLocaleString("ko-KR"));
    toast.success(`심사 실행 완료 — ${active.applicants.length}명 분류`);
  }

  function handleCreate() {
    if (!newName.trim()) {
      toast.error("프로젝트 이름을 입력하세요");
      return;
    }
    addProject(newName);
    setNewName("");
    setNewOpen(false);
    toast.success("프로젝트 생성 완료");
  }

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">프로젝트 콘솔</h1>
            <p className="text-sm text-muted-foreground mt-1">심사 프로젝트를 선택하고 지원자별 결과를 운영합니다.</p>
          </div>
          <Button onClick={() => setNewOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" /> 새 프로젝트</Button>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,250px)_1fr] gap-2">
          {/* Left: project list */}
          <div className="flex flex-col gap-3">
            <SectionCard bodyClassName="space-y-3 p-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="프로젝트 검색" className="h-9 pl-8" />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="preparing">준비중</SelectItem>
                  <SelectItem value="screening">심사중</SelectItem>
                  <SelectItem value="confirmed">확정</SelectItem>
                  <SelectItem value="sending">메일발송중</SelectItem>
                  <SelectItem value="closed">종료</SelectItem>
                </SelectContent>
              </Select>
            </SectionCard>

            <div className="space-y-1.5">
              {filteredProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProjectId(p.id)}
                  className={`w-full text-left rounded-lg border bg-card px-3 py-2.5 transition ${activeProjectId === p.id ? "border-primary/40 ring-1 ring-primary/20" : "hover:bg-accent/50"}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge className={`${STATUS_VARIANT[p.status]} text-[10px] shrink-0 px-1.5 py-0`}>{STATUS_LABEL[p.status]}</Badge>
                    <span className="text-sm font-medium truncate min-w-0 flex-1">{p.name}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground truncate leading-tight">
                    업로드 {p.lastUploadAt || "—"}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate leading-tight">
                    <span className="font-mono text-foreground">{p.criteriaVersion || "—"}</span> · 지원 <span className="text-foreground tabular-nums">{p.applicants.length}</span> · 우선 <span className="text-primary tabular-nums">{p.totals.priority}</span>
                  </div>
                </button>
              ))}
              {filteredProjects.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">조건에 맞는 프로젝트가 없습니다.</p>}
            </div>
          </div>

          {/* Right: console */}
          <div className="flex flex-col gap-4 min-w-0">
            <SectionCard>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold">{active?.name}</h2>
                  {active && <Badge className={STATUS_VARIANT[active.status]}>{STATUS_LABEL[active.status]}</Badge>}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">심사요건</span>
                  <Select
                    value={active?.criteriaVersions.find((v) => v.active)?.id ?? active?.criteriaVersions[0]?.id}
                    onValueChange={(id) => {
                      if (!active) return;
                      updateProject(active.id, {
                        criteriaVersions: active.criteriaVersions.map((v) => ({ ...v, active: v.id === id })),
                      });
                    }}
                  >
                    <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {active?.criteriaVersions.map((v) => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleRun}><Play className="h-3.5 w-3.5 mr-1" /> 심사 실행</Button>
                  <Button size="sm" variant="outline" onClick={handleRun}><RotateCcw className="h-3.5 w-3.5 mr-1" /> 재실행</Button>
                  {lastRunAt && <span className="text-[11px] text-muted-foreground">마지막 실행 {lastRunAt}</span>}
                </div>
              </div>
            </SectionCard>

            <SectionCard bodyClassName="p-0">
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b">
                <h3 className="text-sm font-semibold">
                  지원자 목록 <span className="text-muted-foreground font-normal">({filteredApplicants.length}/{active?.applicants.length ?? 0})</span>
                </h3>
                {dirty && <span className="text-[11px] text-amber-600 dark:text-amber-400">· 변경됨</span>}
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={appSearchInput}
                      onChange={(e) => setAppSearchInput(e.target.value)}
                      placeholder="이름/이메일/연락처/회사 검색"
                      className="h-9 pl-8 w-64"
                    />
                  </div>
                  <Select value={catFilter} onValueChange={(v) => setCatFilter(v as any)}>
                    <SelectTrigger className="h-9 w-32"><SelectValue placeholder="분류" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 분류</SelectItem>
                      {(Object.keys(CATEGORY_LABEL) as ApplicantCategory[]).map((c) => (
                        <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={appStatusFilter} onValueChange={(v) => setAppStatusFilter(v as any)}>
                    <SelectTrigger className="h-9 w-32"><SelectValue placeholder="상태" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 상태</SelectItem>
                      {Object.entries(APPLICANT_STATUS_LABEL).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                    <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="category">분류 우선순위</SelectItem>
                      <SelectItem value="score_desc">총점 높은순</SelectItem>
                      <SelectItem value="score_asc">총점 낮은순</SelectItem>
                      <SelectItem value="id">응답ID순</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <TooltipProvider delayDuration={300}>
                <div className="overflow-auto max-h-[calc(100vh-380px)]">
                  <table className="w-full text-sm caption-bottom" style={{ tableLayout: "fixed" }}>
                    <colgroup>
                      <col style={{ width: COL_WIDTHS.check }} />
                      <col style={{ width: COL_WIDTHS.id }} />
                      <col style={{ width: COL_WIDTHS.name }} />
                      <col style={{ width: COL_WIDTHS.phone }} />
                      <col style={{ width: COL_WIDTHS.email }} />
                      <col style={{ width: COL_WIDTHS.brand }} />
                      <col style={{ width: COL_WIDTHS.age }} />
                      <col style={{ width: COL_WIDTHS.rev }} />
                      <col style={{ width: COL_WIDTHS.bud }} />
                      <col style={{ width: COL_WIDTHS.attend }} />
                      <col style={{ width: COL_WIDTHS.auto }} />
                      <col style={{ width: COL_WIDTHS.manual }} />
                      <col style={{ width: COL_WIDTHS.total }} />
                      <col style={{ width: COL_WIDTHS.category }} />
                      <col style={{ width: COL_WIDTHS.status }} />
                      <col style={{ width: COL_WIDTHS.memo }} />
                    </colgroup>
                    <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_0_hsl(var(--border))]">
                      <tr className="text-muted-foreground">
                        {["", "응답ID", "이름", "연락처", "이메일", "회사", "연령대", "매출", "예산"].map((h, i) => (
                          <th key={i} className="h-10 px-3 text-left font-medium text-xs whitespace-nowrap">{h || <Checkbox />}</th>
                        ))}
                        <th className="h-10 px-3 text-right font-medium text-xs">참석</th>
                        <th className="h-10 px-3 text-right font-medium text-xs">자동</th>
                        <th className="h-10 px-3 text-right font-medium text-xs">수동</th>
                        <th className="h-10 px-3 text-right font-medium text-xs">총점</th>
                        <th className="h-10 px-3 text-left font-medium text-xs">분류</th>
                        <th className="h-10 px-3 text-left font-medium text-xs">상태</th>
                        <th className="h-10 px-1 font-medium text-xs"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplicants.map((a) => (
                        <tr
                          key={a.id}
                          className="border-b cursor-pointer transition-colors hover:bg-accent/50"
                          onClick={() => setSelectedAppId(a.id)}
                        >
                          <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><Checkbox /></td>
                          <td className="px-3 py-2 font-mono text-[11px] truncate" title={a.id}>{a.id}</td>
                          <td className="px-3 py-2 truncate" title={a.name}>{a.name}</td>
                          <EllipsisCell value={a.phone} className="text-xs" />
                          <EllipsisCell value={a.email} className="text-xs text-muted-foreground" />
                          <EllipsisCell value={a.brand} />
                          <td className="px-3 py-2 truncate" title={a.ageGroup}>{a.ageGroup}</td>
                          <td className="px-3 py-2 truncate" title={a.revenueBand}>{a.revenueBand}</td>
                          <td className="px-3 py-2 truncate" title={a.budgetBand}>{a.budgetBand}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{a.attendCount}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{a.autoScore}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{a.manualScore}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-semibold">{a.totalScore}</td>
                          <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                            <Select value={a.category} onValueChange={(v) => handleCategoryChange(a.id, v as ApplicantCategory)}>
                              <SelectTrigger className={`h-7 px-2 text-[11px] border ${CATEGORY_VARIANT[a.category]}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(Object.keys(CATEGORY_LABEL) as ApplicantCategory[]).map((c) => (
                                  <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2"><Badge variant="outline" className="text-[10px] whitespace-nowrap">{APPLICANT_STATUS_LABEL[a.status]}</Badge></td>
                          <td className="px-1 py-2 text-center">{a.memo && <StickyNote className="h-3 w-3 text-amber-500 inline" />}</td>
                        </tr>
                      ))}
                      {filteredApplicants.length === 0 && (
                        <tr><td colSpan={16} className="text-center text-muted-foreground text-sm py-12">조건에 맞는 지원자가 없습니다.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TooltipProvider>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* Applicant detail drawer */}
      <Sheet open={!!selectedApp} onOpenChange={(o) => !o && setSelectedAppId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedApp && (
            <ApplicantDetail
              applicant={selectedApp}
              onChange={(patch) => active && updateApplicant(active.id, selectedApp.id, patch)}
              onSave={() => { toast.success("저장 완료(더미)"); }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* New project dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>새 심사 프로젝트</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>프로젝트 이름</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="예: 5월 세미나 모집" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>취소</Button>
            <Button onClick={handleCreate}>생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Priority change confirm */}
      <Dialog open={!!confirmPriority} onOpenChange={(o) => !o && setConfirmPriority(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>우선선발로 지정할까요?</DialogTitle>
            <DialogDescription>해당 지원자의 분류를 "우선선발"로 변경합니다.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPriority(null)}>취소</Button>
            <Button onClick={confirmPriorityChange}>지정</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function EllipsisCell({ value, className = "" }: { value: string; className?: string }) {
  return (
    <td className={`px-3 py-2 truncate ${className}`} title={value}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="block truncate">{value}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-md break-all">{value}</TooltipContent>
      </Tooltip>
    </td>
  );
}

function ApplicantDetail({ applicant, onChange, onSave }: { applicant: Applicant; onChange: (p: Partial<Applicant>) => void; onSave: () => void }) {
  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          {applicant.name}
          <Badge variant="outline" className="text-[10px]">{applicant.brand}</Badge>
        </SheetTitle>
      </SheetHeader>
      <div className="mt-4 space-y-5">
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">원문 응답</h3>
          <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
            {Object.entries(applicant.rawAnswers).map(([k, v]) => (
              <div key={k}>
                <div className="text-[11px] text-muted-foreground">{k}</div>
                <div>{v}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">자동 점수 근거</h3>
          <div className="space-y-1 text-sm">
            {(applicant.scoreBreakdown ?? []).map((b, i) => (
              <div key={i} className="flex items-center justify-between border-b py-1.5">
                <span>{b.label} <span className="text-muted-foreground text-xs">· {b.detail}</span></span>
                <span className="tabular-nums font-mono">{b.score}</span>
              </div>
            ))}
            {(applicant.scoreBreakdown ?? []).length === 0 && <p className="text-xs text-muted-foreground">심사 실행 전</p>}
            <div className="flex items-center justify-between pt-2 font-semibold">
              <span>총점</span>
              <span className="tabular-nums">{applicant.totalScore}</span>
            </div>
          </div>
        </section>

        <Separator />

        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground">수동 평가</h3>
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span>수동 점수</span>
              <span className="tabular-nums font-mono">{applicant.manualScore}</span>
            </div>
            <Slider min={0} max={30} step={1} value={[applicant.manualScore]} onValueChange={([v]) => onChange({ manualScore: v, totalScore: applicant.autoScore + v })} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="force-priority" className="text-sm">강제 우선선발</Label>
            <Switch id="force-priority" checked={!!applicant.forcePriority} onCheckedChange={(v) => onChange({ forcePriority: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="force-exclude" className="text-sm">강제 제외</Label>
            <Switch id="force-exclude" checked={!!applicant.forceExclude} onCheckedChange={(v) => onChange({ forceExclude: v })} />
          </div>

          <div>
            <Label className="text-sm">분류</Label>
            <Select value={applicant.category} onValueChange={(v) => onChange({ category: v as ApplicantCategory })}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABEL) as ApplicantCategory[]).map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm">상태</Label>
            <Select value={applicant.status} onValueChange={(v) => onChange({ status: v as any })}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(APPLICANT_STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">"심사완료"부터 Dashboard 집계에 포함됩니다.</p>
          </div>

          <div>
            <Label className="text-sm">운영 메모</Label>
            <Textarea value={applicant.memo ?? ""} onChange={(e) => onChange({ memo: e.target.value })} rows={3} className="mt-1" />
          </div>
        </section>

        <Separator />

        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">변경 이력</h3>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>· 2026-04-19 14:22 — 자동 심사 실행</li>
            <li>· 2026-04-18 10:05 — 데이터 업로드</li>
          </ul>
        </section>

        <Button className="w-full" onClick={onSave}>저장</Button>
      </div>
    </>
  );
}
