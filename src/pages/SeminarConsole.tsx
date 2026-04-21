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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useScreeningStore } from "@/lib/screening/store";
import { CATEGORY_LABEL, APPLICANT_STATUS_LABEL, STATUS_LABEL, type ApplicantCategory, type ApplicantStatus, type ProjectStatus, type Applicant } from "@/lib/screening/types";
import { Search, Play, RotateCcw, Plus, StickyNote } from "lucide-react";
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

  const filteredProjects = projects.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  const selectedApp = active?.applicants.find((a) => a.id === selectedAppId) ?? null;

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

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,340px)_1fr] gap-4">
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

            <div className="space-y-2">
              {filteredProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProjectId(p.id)}
                  className={`w-full text-left rounded-lg border bg-card p-4 transition ${activeProjectId === p.id ? "border-primary/40 ring-1 ring-primary/20" : "hover:bg-accent/50"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">최근 업로드 {p.lastUploadAt}</div>
                    </div>
                    <Badge className={`${STATUS_VARIANT[p.status]} text-[10px] shrink-0`}>{STATUS_LABEL[p.status]}</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>버전 <span className="font-mono text-foreground">{p.criteriaVersion}</span></span>
                    <span>·</span>
                    <span>지원 <span className="text-foreground tabular-nums">{p.applicants.length}</span></span>
                    <span>·</span>
                    <span>우선 <span className="text-primary tabular-nums">{p.totals.priority}</span></span>
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

            <SectionCard title={`지원자 목록 (${active?.applicants.length ?? 0})`} bodyClassName="p-0">
              <div className="overflow-x-auto max-h-[calc(100vh-340px)]">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="w-10"><Checkbox /></TableHead>
                      <TableHead>응답ID</TableHead>
                      <TableHead>이름</TableHead>
                      <TableHead>연락처</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>회사</TableHead>
                      <TableHead>연령대</TableHead>
                      <TableHead>매출</TableHead>
                      <TableHead>예산</TableHead>
                      <TableHead className="text-right">참석</TableHead>
                      <TableHead className="text-right">자동</TableHead>
                      <TableHead className="text-right">수동</TableHead>
                      <TableHead className="text-right">총점</TableHead>
                      <TableHead>분류</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {active?.applicants.map((a) => (
                      <TableRow key={a.id} className="cursor-pointer" onClick={() => setSelectedAppId(a.id)}>
                        <TableCell onClick={(e) => e.stopPropagation()}><Checkbox /></TableCell>
                        <TableCell className="font-mono text-[11px]">{a.id}</TableCell>
                        <TableCell>{a.name}</TableCell>
                        <TableCell className="text-xs">{a.phone}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{a.email}</TableCell>
                        <TableCell>{a.brand}</TableCell>
                        <TableCell>{a.ageGroup}</TableCell>
                        <TableCell>{a.revenueBand}</TableCell>
                        <TableCell>{a.budgetBand}</TableCell>
                        <TableCell className="text-right tabular-nums">{a.attendCount}</TableCell>
                        <TableCell className="text-right tabular-nums">{a.autoScore}</TableCell>
                        <TableCell className="text-right tabular-nums">{a.manualScore}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{a.totalScore}</TableCell>
                        <TableCell><Badge variant="outline" className={`${CATEGORY_VARIANT[a.category]} text-[10px]`}>{CATEGORY_LABEL[a.category]}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{APPLICANT_STATUS_LABEL[a.status]}</Badge></TableCell>
                        <TableCell>{a.memo && <StickyNote className="h-3 w-3 text-amber-500" />}</TableCell>
                      </TableRow>
                    ))}
                    {(active?.applicants.length ?? 0) === 0 && (
                      <TableRow><TableCell colSpan={16} className="text-center text-muted-foreground text-sm py-12">지원자 데이터가 없습니다. DB 관리에서 업로드하세요.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
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
    </Layout>
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
