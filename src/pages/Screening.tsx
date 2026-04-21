import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import {
  Plus, Search, Upload, Download, Copy, Lock, Unlock, Play, RotateCcw,
  FileText, Send, FileSpreadsheet, Mail, AlertTriangle, CheckCircle2,
  StickyNote, Users, Star, Clock, ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { MOCK_PROJECTS } from "@/lib/screening/mockData";
import {
  STATUS_LABEL, CATEGORY_LABEL, APPLICANT_STATUS_LABEL,
  type ScreeningProject, type Applicant, type ProjectStatus, type ApplicantCategory,
} from "@/lib/screening/types";

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

export default function ScreeningPage() {
  const [projects, setProjects] = useState<ScreeningProject[]>(MOCK_PROJECTS);
  const [activeId, setActiveId] = useState<string>(MOCK_PROJECTS[0].id);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [tab, setTab] = useState("overview");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const active = projects.find((p) => p.id === activeId)!;

  const filteredProjects = projects.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  function updateProject(id: string, patch: Partial<ScreeningProject>) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function createProject() {
    if (!newProjectName.trim()) {
      toast.error("프로젝트 이름을 입력해주세요");
      return;
    }
    const id = `p-${Date.now()}`;
    const newP: ScreeningProject = {
      id,
      name: newProjectName.trim(),
      status: "preparing",
      lastUploadAt: "-",
      criteriaVersion: "v1",
      totals: { applicants: 0, priority: 0, selected: 0, reserve: 0 },
      memo: "",
      applicants: [],
      uploads: [],
      criteriaVersions: [
        { id: "cv1", label: "v1", createdAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 10), author: "나", active: true, locked: false },
      ],
      snapshots: [],
      sendLogs: [],
    };
    setProjects((prev) => [newP, ...prev]);
    setActiveId(id);
    setNewProjectName("");
    setNewProjectOpen(false);
    toast.success("새 프로젝트가 생성되었습니다");
  }

  function duplicateProject(p: ScreeningProject) {
    const id = `p-${Date.now()}`;
    setProjects((prev) => [{ ...p, id, name: `${p.name} (복제)`, status: "preparing" }, ...prev]);
    setActiveId(id);
    toast.success("프로젝트를 복제했습니다");
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">심사 운영 콘솔</h1>
          <p className="text-sm text-muted-foreground mt-1">
            세미나/이벤트 지원자 업로드 → 심사 → 확정 → 발송까지 한 화면에서 운영합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          {/* LEFT: project list */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">심사 프로젝트</CardTitle>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setNewProjectOpen(true)}>
                  <Plus className="h-3 w-3 mr-1" /> 새 프로젝트
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  className="pl-7 h-8 text-xs"
                  placeholder="프로젝트 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProjectStatus | "all")}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  {(Object.keys(STATUS_LABEL) as ProjectStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-1.5 pt-1 max-h-[600px] overflow-auto">
                {filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActiveId(p.id)}
                    className={`w-full text-left rounded-md border p-2.5 transition-colors ${
                      p.id === activeId ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${STATUS_VARIANT[p.status]}`}>
                        {STATUS_LABEL[p.status]}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      업로드 {p.lastUploadAt} · 심사요건 {p.criteriaVersion}
                    </div>
                    <div className="flex gap-3 text-[11px] text-muted-foreground mt-1.5">
                      <span>총 <b className="text-foreground">{p.totals.applicants}</b></span>
                      <span>우선 <b className="text-foreground">{p.totals.priority}</b></span>
                      <span>선발 <b className="text-foreground">{p.totals.selected}</b></span>
                      <span>예비 <b className="text-foreground">{p.totals.reserve}</b></span>
                    </div>
                  </button>
                ))}
                {filteredProjects.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-6">조건에 맞는 프로젝트가 없습니다.</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* RIGHT: tabs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">{active.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    상태 <Badge variant="outline" className={`ml-1 text-[10px] ${STATUS_VARIANT[active.status]}`}>{STATUS_LABEL[active.status]}</Badge>
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid grid-cols-6 w-full">
                  <TabsTrigger value="overview" className="text-xs">개요</TabsTrigger>
                  <TabsTrigger value="upload" className="text-xs">업로드</TabsTrigger>
                  <TabsTrigger value="criteria" className="text-xs">심사요건</TabsTrigger>
                  <TabsTrigger value="results" className="text-xs">심사결과</TabsTrigger>
                  <TabsTrigger value="confirm" className="text-xs">확정/발송</TabsTrigger>
                  <TabsTrigger value="dashboard" className="text-xs">대시보드</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <OverviewTab project={active} update={(patch) => updateProject(active.id, patch)} onDuplicate={() => duplicateProject(active)} />
                </TabsContent>
                <TabsContent value="upload" className="mt-4">
                  <UploadTab project={active} />
                </TabsContent>
                <TabsContent value="criteria" className="mt-4">
                  <CriteriaTab project={active} update={(patch) => updateProject(active.id, patch)} />
                </TabsContent>
                <TabsContent value="results" className="mt-4">
                  <ResultsTab project={active} update={(patch) => updateProject(active.id, patch)} />
                </TabsContent>
                <TabsContent value="confirm" className="mt-4">
                  <ConfirmTab project={active} update={(patch) => updateProject(active.id, patch)} />
                </TabsContent>
                <TabsContent value="dashboard" className="mt-4">
                  <DashboardTab project={active} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>새 심사 프로젝트</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">프로젝트 이름</Label>
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="예: 세미나 3기 모집"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewProjectOpen(false)}>취소</Button>
            <Button onClick={createProject}>생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

/* ---------------- Overview ---------------- */
function OverviewTab({
  project, update, onDuplicate,
}: {
  project: ScreeningProject;
  update: (patch: Partial<ScreeningProject>) => void;
  onDuplicate: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className={STATUS_VARIANT[project.status]}>{STATUS_LABEL[project.status]}</Badge>
        <Select value={project.status} onValueChange={(v) => { update({ status: v as ProjectStatus }); toast.success("상태 변경됨"); }}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(STATUS_LABEL) as ProjectStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="ml-auto" onClick={onDuplicate}>
          <Copy className="h-3.5 w-3.5 mr-1" /> 프로젝트 복제
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon={Users} label="총 지원자" value={project.totals.applicants} />
        <SummaryCard icon={Star} label="우선선발" value={project.totals.priority} />
        <SummaryCard icon={CheckCircle2} label="선발" value={project.totals.selected} />
        <SummaryCard icon={Clock} label="예비선발" value={project.totals.reserve} />
      </div>

      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1.5"><StickyNote className="h-3.5 w-3.5" /> 프로젝트 메모</Label>
        <Textarea
          value={project.memo}
          onChange={(e) => update({ memo: e.target.value })}
          placeholder="운영 메모"
          rows={4}
        />
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div>
        <div className="text-2xl font-semibold mt-1">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}

/* ---------------- Upload ---------------- */
function UploadTab({ project }: { project: ScreeningProject }) {
  const [overwrite, setOverwrite] = useState<"overwrite" | "append">("append");
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [previewRows] = useState(() => project.applicants.slice(0, 10));
  const [logs, setLogs] = useState<{ ts: string; msg: string }[]>([]);

  const errorRows = previewRows.filter((r) => !r.email.includes("@") || r.email.includes("invalid"));
  const visibleRows = showOnlyErrors ? errorRows : previewRows;

  function appendLog(msg: string) {
    setLogs((prev) => [{ ts: new Date().toLocaleTimeString(), msg }, ...prev].slice(0, 20));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => { toast.success("샘플 양식 다운로드 (더미)"); appendLog("샘플 양식 다운로드"); }}>
          <Download className="h-3.5 w-3.5 mr-1" /> 샘플 양식
        </Button>
        <RadioGroup value={overwrite} onValueChange={(v) => setOverwrite(v as "overwrite" | "append")} className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-1.5"><RadioGroupItem value="append" id="append" /><Label htmlFor="append" className="text-xs">추가저장</Label></div>
          <div className="flex items-center gap-1.5"><RadioGroupItem value="overwrite" id="overwrite" /><Label htmlFor="overwrite" className="text-xs">덮어쓰기</Label></div>
        </RadioGroup>
      </div>

      <div
        className="rounded-lg border-2 border-dashed border-border hover:border-primary/40 transition-colors p-8 text-center cursor-pointer"
        onClick={() => { toast("드롭존 클릭 (더미)"); appendLog("파일 선택 다이얼로그 열림"); }}
      >
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <div className="text-sm font-medium">XLSX 또는 CSV 파일을 드래그하거나 클릭</div>
        <div className="text-xs text-muted-foreground mt-1">최대 10MB</div>
      </div>

      <div>
        <div className="text-xs font-medium mb-2">최근 업로드 이력</div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">파일명</TableHead>
                <TableHead className="text-xs text-right">행 수</TableHead>
                <TableHead className="text-xs">업로드</TableHead>
                <TableHead className="text-xs">담당</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.uploads.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="text-xs">{u.filename}</TableCell>
                  <TableCell className="text-xs text-right">{u.rows}</TableCell>
                  <TableCell className="text-xs">{u.uploadedAt}</TableCell>
                  <TableCell className="text-xs">{u.uploader}</TableCell>
                </TableRow>
              ))}
              {project.uploads.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-xs text-center text-muted-foreground">업로드 이력 없음</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium">업로드 미리보기 ({previewRows.length}행)</div>
          <div className="flex items-center gap-2">
            <Switch checked={showOnlyErrors} onCheckedChange={setShowOnlyErrors} />
            <Label className="text-xs">오류 행만 보기</Label>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" /> 필수컬럼 OK</Badge>
          <Badge variant="outline" className="text-[10px]">{errorRows.length > 0 ? <><AlertTriangle className="h-3 w-3 mr-1 text-amber-500" /> 이메일 형식 경고 {errorRows.length}건</> : <><CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" /> 이메일 OK</>}</Badge>
          <Badge variant="outline" className="text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" /> 전화번호 OK</Badge>
          <Badge variant="outline" className="text-[10px]"><AlertTriangle className="h-3 w-3 mr-1 text-amber-500" /> 중복응답 1건</Badge>
        </div>
        <div className="rounded-md border max-h-72 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">이름</TableHead>
                <TableHead className="text-xs">이메일</TableHead>
                <TableHead className="text-xs">브랜드</TableHead>
                <TableHead className="text-xs">매출</TableHead>
                <TableHead className="text-xs">예산</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{r.name}</TableCell>
                  <TableCell className="text-xs">
                    {r.email.includes("@") ? r.email : <span className="text-amber-600 dark:text-amber-400">{r.email} ⚠</span>}
                  </TableCell>
                  <TableCell className="text-xs">{r.brand}</TableCell>
                  <TableCell className="text-xs">{r.revenueBand}</TableCell>
                  <TableCell className="text-xs">{r.budgetBand}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">저장 옵션: {overwrite === "overwrite" ? "덮어쓰기" : "추가저장"}</div>
        <Button size="sm" onClick={() => { toast.success(`저장 완료 (${previewRows.length}행)`); appendLog(`저장 성공: ${previewRows.length}행 (${overwrite})`); }}>
          저장
        </Button>
      </div>

      <div>
        <div className="text-xs font-medium mb-2">업로드 로그</div>
        <div className="rounded-md border bg-muted/20 p-2 max-h-32 overflow-auto text-xs font-mono space-y-0.5">
          {logs.length === 0 ? <div className="text-muted-foreground">로그 없음</div> : logs.map((l, i) => (
            <div key={i}><span className="text-muted-foreground">[{l.ts}]</span> {l.msg}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Criteria ---------------- */
function CriteriaTab({ project, update }: { project: ScreeningProject; update: (patch: Partial<ScreeningProject>) => void }) {
  const [selected, setSelected] = useState(project.criteriaVersions.find((v) => v.active)?.id ?? project.criteriaVersions[0]?.id);
  const sel = project.criteriaVersions.find((v) => v.id === selected);

  function toggleLock(id: string) {
    update({ criteriaVersions: project.criteriaVersions.map((v) => v.id === id ? { ...v, locked: !v.locked } : v) });
  }
  function dupVersion(id: string) {
    const src = project.criteriaVersions.find((v) => v.id === id)!;
    const newId = `cv-${Date.now()}`;
    const newLabel = `v${project.criteriaVersions.length + 1}`;
    update({ criteriaVersions: [...project.criteriaVersions, { ...src, id: newId, label: newLabel, active: false, locked: false, createdAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 10) }] });
    toast.success(`${newLabel} 생성됨`);
  }
  function applyVersion(id: string) {
    const v = project.criteriaVersions.find((x) => x.id === id)!;
    update({
      criteriaVersion: v.label,
      criteriaVersions: project.criteriaVersions.map((x) => ({ ...x, active: x.id === id })),
    });
    toast.success(`${v.label} 적용됨`);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">버전 목록</div>
        {project.criteriaVersions.map((v) => (
          <button
            key={v.id}
            onClick={() => setSelected(v.id)}
            className={`w-full text-left rounded-md border p-2.5 transition-colors ${selected === v.id ? "border-primary bg-primary/5" : "hover:bg-accent/50"}`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{v.label}</div>
              <div className="flex items-center gap-1">
                {v.active && <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">사용중</Badge>}
                {v.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">생성 {v.createdAt} · 수정 {v.updatedAt}</div>
            <div className="text-[11px] text-muted-foreground">작성 {v.author}</div>
            <div className="flex gap-1 mt-2">
              <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2" onClick={(e) => { e.stopPropagation(); dupVersion(v.id); }}>
                <Copy className="h-3 w-3 mr-1" /> 복제
              </Button>
              <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2" onClick={(e) => { e.stopPropagation(); toggleLock(v.id); }}>
                {v.locked ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                {v.locked ? "해제" : "잠금"}
              </Button>
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">{sel?.label} 편집</div>
          {sel?.locked && <Badge variant="outline" className="text-[10px]"><Lock className="h-3 w-3 mr-1" /> 잠김</Badge>}
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => toast.success("샘플 5명 결과 생성됨 (더미)")}>
              <Play className="h-3.5 w-3.5 mr-1" /> 테스트 심사
            </Button>
            <Button size="sm" onClick={() => sel && applyVersion(sel.id)} disabled={!sel || sel.active}>
              현재 프로젝트에 적용
            </Button>
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground">정량 항목 (자동 계산)</div>
        <Accordion type="multiple" className="w-full">
          <CriteriaAccordionItem id="rev" title="매출액 (20점)" rows={[
            ["10억+", 20], ["5-10억", 15], ["1-5억", 10], ["<1억", 5],
          ]} locked={!!sel?.locked} />
          <CriteriaAccordionItem id="mall" title="자사몰 운영 (10점)" rows={[
            ["보유", 10], ["미보유", 0],
          ]} locked={!!sel?.locked} />
          <CriteriaAccordionItem id="age" title="연령대 (10점)" rows={[
            ["30대", 10], ["40대", 8], ["20대", 6], ["50대+", 4],
          ]} locked={!!sel?.locked} />
          <CriteriaAccordionItem id="budget" title="가용예산 (15점)" rows={[
            ["1000만+", 15], ["500-1000만", 10], ["300-500만", 6], ["<300만", 2],
          ]} locked={!!sel?.locked} />
          <CriteriaAccordionItem id="biz" title="사업관련성 (12점)" rows={[
            ["매우 적합", 12], ["적합", 8], ["보통", 4], ["낮음", 0],
          ]} locked={!!sel?.locked} />
        </Accordion>

        <Separator />
        <div className="text-[11px] text-muted-foreground">정성 항목 (수동 평가)</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            ["실행의지", 12],
            ["사유구체성", 11],
            ["주제적합성", 5],
            ["확실성", 5],
          ].map(([name, max]) => (
            <Card key={name as string}>
              <CardContent className="p-3">
                <div className="text-xs font-medium">{name} <span className="text-muted-foreground">({max}점)</span></div>
                <div className="text-[11px] text-muted-foreground mt-1">평가 모드: 5단계 슬라이더</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function CriteriaAccordionItem({ id, title, rows, locked }: { id: string; title: string; rows: [string, number][]; locked: boolean }) {
  return (
    <AccordionItem value={id}>
      <AccordionTrigger className="text-sm">{title}</AccordionTrigger>
      <AccordionContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">구간 / 옵션</TableHead>
                <TableHead className="text-xs text-right">점수</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(([label, score]) => (
                <TableRow key={label}>
                  <TableCell className="text-xs">{label}</TableCell>
                  <TableCell className="text-xs text-right">{score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="outline" disabled={locked}>+ 행 추가</Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

/* ---------------- Results ---------------- */
function ResultsTab({ project, update }: { project: ScreeningProject; update: (patch: Partial<ScreeningProject>) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const [version, setVersion] = useState(project.criteriaVersion);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function runScreening() {
    const updated = project.applicants.map((a, idx) => {
      const auto = Math.round(40 + Math.random() * 50);
      const manual = Math.round(Math.random() * 25);
      const total = auto + manual;
      let category: ApplicantCategory = "excluded";
      if (total >= 110) category = "priority";
      else if (total >= 90) category = "selected";
      else if (total >= 70) category = "reserve";
      return {
        ...a,
        autoScore: auto,
        manualScore: manual,
        totalScore: total,
        category: a.forcePriority ? "priority" : a.forceExclude ? "excluded" : category,
        status: "screened" as const,
        scoreBreakdown: [
          { label: "매출액", score: 15, detail: a.revenueBand },
          { label: "자사몰", score: a.ownsMall ? 10 : 0, detail: a.ownsMall ? "보유" : "미보유" },
          { label: "연령대", score: 8, detail: a.ageGroup },
          { label: "가용예산", score: 10, detail: a.budgetBand },
          { label: "사업관련성", score: 12, detail: a.topicFit },
        ],
        history: [{ ts: new Date().toLocaleString(), msg: `자동 심사 실행 (${version})` }],
      };
    });
    const totals = {
      applicants: updated.length,
      priority: updated.filter((a) => a.category === "priority").length,
      selected: updated.filter((a) => a.category === "selected").length,
      reserve: updated.filter((a) => a.category === "reserve").length,
    };
    update({ applicants: updated, totals });
    setLastRunAt(new Date().toLocaleString());
    toast.success(`심사 실행 완료 (${updated.length}명)`);
  }

  const selected = project.applicants.find((a) => a.id === selectedId) ?? null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-xs text-muted-foreground">심사요건</div>
        <Select value={version} onValueChange={setVersion}>
          <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {project.criteriaVersions.map((v) => <SelectItem key={v.id} value={v.label}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={runScreening}><Play className="h-3.5 w-3.5 mr-1" /> 심사 실행</Button>
        <Button size="sm" variant="outline" onClick={runScreening}><RotateCcw className="h-3.5 w-3.5 mr-1" /> 재실행</Button>
        <div className="text-xs text-muted-foreground ml-auto">
          마지막 실행: {lastRunAt ?? "—"}
        </div>
      </div>

      <div className="rounded-md border max-h-[560px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead className="text-xs">ID</TableHead>
              <TableHead className="text-xs">이름</TableHead>
              <TableHead className="text-xs">브랜드</TableHead>
              <TableHead className="text-xs">연령</TableHead>
              <TableHead className="text-xs">매출</TableHead>
              <TableHead className="text-xs">예산</TableHead>
              <TableHead className="text-xs text-right">참석</TableHead>
              <TableHead className="text-xs text-right">자동</TableHead>
              <TableHead className="text-xs text-right">수동</TableHead>
              <TableHead className="text-xs text-right">총점</TableHead>
              <TableHead className="text-xs">분류</TableHead>
              <TableHead className="text-xs">상태</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {project.applicants.map((a) => (
              <TableRow key={a.id} className="cursor-pointer" onClick={() => setSelectedId(a.id)}>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={checked.has(a.id)}
                    onCheckedChange={(v) => {
                      const next = new Set(checked);
                      if (v) next.add(a.id); else next.delete(a.id);
                      setChecked(next);
                    }}
                  />
                </TableCell>
                <TableCell className="text-xs font-mono">{a.id}</TableCell>
                <TableCell className="text-xs">{a.name}</TableCell>
                <TableCell className="text-xs">{a.brand}</TableCell>
                <TableCell className="text-xs">{a.ageGroup}</TableCell>
                <TableCell className="text-xs">{a.revenueBand}</TableCell>
                <TableCell className="text-xs">{a.budgetBand}</TableCell>
                <TableCell className="text-xs text-right">{a.attendCount}</TableCell>
                <TableCell className="text-xs text-right">{a.autoScore || "—"}</TableCell>
                <TableCell className="text-xs text-right">{a.manualScore || "—"}</TableCell>
                <TableCell className="text-xs text-right font-medium">{a.totalScore || "—"}</TableCell>
                <TableCell><Badge variant="outline" className={`text-[10px] ${CATEGORY_VARIANT[a.category]}`}>{CATEGORY_LABEL[a.category]}</Badge></TableCell>
                <TableCell className="text-xs">{APPLICANT_STATUS_LABEL[a.status]}</TableCell>
                <TableCell>{a.memo ? <StickyNote className="h-3.5 w-3.5 text-amber-500" /> : null}</TableCell>
              </TableRow>
            ))}
            {project.applicants.length === 0 && (
              <TableRow><TableCell colSpan={14} className="text-xs text-center text-muted-foreground py-6">지원자 없음 — 업로드 탭에서 데이터를 추가하세요.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ApplicantDrawer
        applicant={selected}
        onClose={() => setSelectedId(null)}
        onSave={(patch) => {
          update({ applicants: project.applicants.map((a) => a.id === selected?.id ? { ...a, ...patch } : a) });
          toast.success("저장됨");
        }}
      />
    </div>
  );
}

function ApplicantDrawer({ applicant, onClose, onSave }: {
  applicant: Applicant | null;
  onClose: () => void;
  onSave: (patch: Partial<Applicant>) => void;
}) {
  const [manual, setManual] = useState(applicant?.manualScore ?? 0);
  const [memo, setMemo] = useState(applicant?.memo ?? "");
  const [forcePri, setForcePri] = useState(!!applicant?.forcePriority);
  const [forceExc, setForceExc] = useState(!!applicant?.forceExclude);
  const [category, setCategory] = useState<ApplicantCategory>(applicant?.category ?? "unclassified");
  const [showRaw, setShowRaw] = useState(false);

  // sync when changing applicant
  useMemo(() => {
    if (applicant) {
      setManual(applicant.manualScore);
      setMemo(applicant.memo ?? "");
      setForcePri(!!applicant.forcePriority);
      setForceExc(!!applicant.forceExclude);
      setCategory(applicant.category);
    }
  }, [applicant?.id]);

  return (
    <Sheet open={!!applicant} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-md w-full overflow-y-auto">
        {applicant && (
          <>
            <SheetHeader>
              <SheetTitle>{applicant.name} <span className="text-xs text-muted-foreground font-normal">{applicant.id}</span></SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="text-xs space-y-1">
                <div><span className="text-muted-foreground">브랜드</span> {applicant.brand}</div>
                <div><span className="text-muted-foreground">이메일</span> {applicant.email}</div>
                <div><span className="text-muted-foreground">연락처</span> {applicant.phone}</div>
                <div><span className="text-muted-foreground">참석 이력</span> {applicant.attendCount}회</div>
              </div>

              <div>
                <Button variant="ghost" size="sm" className="h-7 text-xs px-1" onClick={() => setShowRaw((s) => !s)}>
                  <FileText className="h-3.5 w-3.5 mr-1" /> 원문 응답 {showRaw ? "접기" : "펼치기"}
                </Button>
                {showRaw && (
                  <div className="mt-2 space-y-2 rounded-md border p-3 bg-muted/30">
                    {Object.entries(applicant.rawAnswers).map(([k, v]) => (
                      <div key={k} className="text-xs">
                        <div className="text-muted-foreground mb-0.5">{k}</div>
                        <div>{v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs font-medium mb-1.5">자동 점수 근거</div>
                <div className="rounded-md border divide-y">
                  {(applicant.scoreBreakdown ?? []).map((s) => (
                    <div key={s.label} className="flex items-center justify-between p-2 text-xs">
                      <div><span className="text-muted-foreground">{s.label}</span> · {s.detail}</div>
                      <div className="font-medium">{s.score}</div>
                    </div>
                  ))}
                  {(!applicant.scoreBreakdown || applicant.scoreBreakdown.length === 0) && (
                    <div className="p-2 text-xs text-muted-foreground">심사 실행 후 표시됩니다.</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">수동 평가 점수: <b>{manual}</b></Label>
                <Slider value={[manual]} max={33} step={1} onValueChange={(v) => setManual(v[0])} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2"><Switch checked={forcePri} onCheckedChange={setForcePri} /><Label className="text-xs">강제 우선선발</Label></div>
                <div className="flex items-center gap-2"><Switch checked={forceExc} onCheckedChange={setForceExc} /><Label className="text-xs">강제 제외</Label></div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">분류 수동 변경</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ApplicantCategory)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_LABEL) as ApplicantCategory[]).map((c) => (
                      <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">운영 메모</Label>
                <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} placeholder="내부 메모" />
              </div>

              <div>
                <div className="text-xs font-medium mb-1.5">변경 이력</div>
                <div className="rounded-md border divide-y text-xs">
                  {(applicant.history ?? [{ ts: "—", msg: "이력 없음" }]).map((h, i) => (
                    <div key={i} className="p-2"><span className="text-muted-foreground">[{h.ts}]</span> {h.msg}</div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-background pb-1">
                <Button variant="ghost" size="sm" onClick={onClose}>닫기</Button>
                <Button size="sm" onClick={() => onSave({ manualScore: manual, memo, forcePriority: forcePri, forceExclude: forceExc, category, totalScore: applicant.autoScore + manual })}>
                  저장
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ---------------- Confirm/Send ---------------- */
function ConfirmTab({ project, update }: { project: ScreeningProject; update: (patch: Partial<ScreeningProject>) => void }) {
  const confirmedList = project.applicants.filter((a) => a.category === "priority" || a.category === "selected");
  const [snapshotId, setSnapshotId] = useState(project.snapshots[0]?.id ?? "");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState("welcome");
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);

  function createSnapshot() {
    const id = `snap-${Date.now()}`;
    const label = `snapshot_${new Date().toISOString().slice(0, 10)}_${project.snapshots.length + 1}`;
    update({ snapshots: [...project.snapshots, { id, label, createdAt: new Date().toLocaleString(), count: confirmedList.length }] });
    setSnapshotId(id);
    toast.success(`확정 스냅샷 생성: ${label}`);
  }

  function send(test: boolean) {
    const targets = confirmedList.filter((a) => !excluded.has(a.id));
    const newLogs = targets.map((a, i) => ({
      id: `log-${Date.now()}-${i}`,
      target: a.email,
      ts: new Date().toLocaleString(),
      ok: a.email.includes("@"),
      message: a.email.includes("@") ? "delivered" : "invalid recipient",
    }));
    update({ sendLogs: [...newLogs, ...project.sendLogs] });
    if (test) toast.success(`테스트 발송 완료 (${targets.length}건)`);
    else toast.success(`실제 발송 완료 (${targets.length}건)`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={createSnapshot}><FileText className="h-3.5 w-3.5 mr-1" /> 확정 스냅샷 생성</Button>
        <Select value={snapshotId} onValueChange={setSnapshotId}>
          <SelectTrigger className="h-8 w-64 text-xs"><SelectValue placeholder="스냅샷 선택" /></SelectTrigger>
          <SelectContent>
            {project.snapshots.map((s) => <SelectItem key={s.id} value={s.id}>{s.label} ({s.count}명)</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={() => toast.success("XLSX 다운로드 (더미)")}><FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> XLSX</Button>
          <Button size="sm" variant="outline" onClick={() => toast.success("PDF 다운로드 (더미)")}><Download className="h-3.5 w-3.5 mr-1" /> PDF</Button>
        </div>
      </div>

      <div>
        <div className="text-xs font-medium mb-2">확정 명단 ({confirmedList.length}명)</div>
        <div className="rounded-md border max-h-80 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead className="text-xs">이름</TableHead>
                <TableHead className="text-xs">이메일</TableHead>
                <TableHead className="text-xs">분류</TableHead>
                <TableHead className="text-xs text-right">총점</TableHead>
                <TableHead className="text-xs">수신 제외</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {confirmedList.map((a) => (
                <TableRow key={a.id}>
                  <TableCell><Checkbox defaultChecked={!excluded.has(a.id)} /></TableCell>
                  <TableCell className="text-xs">{a.name}</TableCell>
                  <TableCell className="text-xs">
                    {a.email.includes("@") ? a.email : <span className="text-amber-600 dark:text-amber-400 inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {a.email}</span>}
                  </TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] ${CATEGORY_VARIANT[a.category]}`}>{CATEGORY_LABEL[a.category]}</Badge></TableCell>
                  <TableCell className="text-xs text-right">{a.totalScore || "—"}</TableCell>
                  <TableCell>
                    <Switch checked={excluded.has(a.id)} onCheckedChange={(v) => {
                      const next = new Set(excluded);
                      if (v) next.add(a.id); else next.delete(a.id);
                      setExcluded(next);
                    }} />
                  </TableCell>
                </TableRow>
              ))}
              {confirmedList.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-xs text-center text-muted-foreground py-6">확정 대상이 없습니다 — 심사결과에서 선발자를 확정하세요.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
        <div className="space-y-2">
          <Label className="text-xs">메일 템플릿</Label>
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="welcome">선발 안내 (welcome)</SelectItem>
              <SelectItem value="reserve">예비 안내 (reserve)</SelectItem>
              <SelectItem value="reject">미선발 안내 (reject)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => send(true)}><Mail className="h-3.5 w-3.5 mr-1" /> 테스트 발송</Button>
          <Button size="sm" onClick={() => setConfirmSendOpen(true)}><Send className="h-3.5 w-3.5 mr-1" /> 실제 발송</Button>
        </div>
      </div>

      <div>
        <div className="text-xs font-medium mb-2">발송 로그</div>
        <div className="rounded-md border max-h-60 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">대상</TableHead>
                <TableHead className="text-xs">시각</TableHead>
                <TableHead className="text-xs">결과</TableHead>
                <TableHead className="text-xs">메시지</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.sendLogs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">{l.target}</TableCell>
                  <TableCell className="text-xs">{l.ts}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] ${l.ok ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>{l.ok ? "성공" : "실패"}</Badge></TableCell>
                  <TableCell className="text-xs">{l.message}</TableCell>
                </TableRow>
              ))}
              {project.sendLogs.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-xs text-center text-muted-foreground py-4">발송 로그 없음</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={confirmSendOpen} onOpenChange={setConfirmSendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>실제 발송 확인</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmedList.length - excluded.size}명에게 “{template}” 템플릿으로 메일을 발송합니다. 계속하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => { send(false); setConfirmSendOpen(false); }}>발송</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
function DashboardTab({ project }: { project: ScreeningProject }) {
  const ageData = useMemo(() => {
    const map: Record<string, number> = {};
    project.applicants.forEach((a) => { map[a.ageGroup] = (map[a.ageGroup] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [project.applicants]);
  const revData = useMemo(() => {
    const map: Record<string, number> = {};
    project.applicants.forEach((a) => { map[a.revenueBand] = (map[a.revenueBand] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [project.applicants]);
  const budgetData = useMemo(() => {
    const map: Record<string, number> = {};
    project.applicants.forEach((a) => { map[a.budgetBand] = (map[a.budgetBand] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [project.applicants]);
  const catData = useMemo(() => {
    const map: Record<ApplicantCategory, number> = { priority: 0, selected: 0, reserve: 0, excluded: 0, unclassified: 0 };
    project.applicants.forEach((a) => { map[a.category]++; });
    return (Object.keys(map) as ApplicantCategory[]).map((k) => ({ name: CATEGORY_LABEL[k], value: map[k] }));
  }, [project.applicants]);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2, 142 70% 45%))", "hsl(var(--chart-3, 38 92% 50%))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];
  const sendOk = project.sendLogs.filter((l) => l.ok).length;
  const sendRate = project.sendLogs.length > 0 ? Math.round((sendOk / project.sendLogs.length) * 100) : 0;
  const avgScore = project.applicants.length > 0
    ? Math.round(project.applicants.reduce((s, a) => s + a.totalScore, 0) / project.applicants.length)
    : 0;
  const attendRate = project.applicants.length > 0
    ? Math.round((project.applicants.filter((a) => a.attendCount > 0).length / project.applicants.length) * 100)
    : 0;
  const top5 = [...project.applicants].sort((a, b) => b.totalScore - a.totalScore).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon={Users} label="총 지원자" value={project.totals.applicants} />
        <SummaryCard icon={Star} label="우선선발" value={project.totals.priority} />
        <SummaryCard icon={CheckCircle2} label="선발" value={project.totals.selected} />
        <SummaryCard icon={Clock} label="예비" value={project.totals.reserve} />
        <SummaryCard icon={Send} label="발송 성공률" value={sendRate} />
        <SummaryCard icon={ListChecks} label="평균 점수" value={avgScore} />
        <SummaryCard icon={Users} label="참석경험 비율" value={attendRate} />
        <SummaryCard icon={FileText} label="확정 스냅샷" value={project.snapshots.length} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ChartCard title="연령대 분포">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="매출 구간 분포">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="예산 구간 분포">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={budgetData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="분류별 비율">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={catData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">최근 업로드</CardTitle></CardHeader>
          <CardContent className="text-xs space-y-1">
            {project.uploads.slice(0, 3).map((u) => <div key={u.id}>· {u.uploadedAt} — {u.filename} ({u.rows}행)</div>)}
            {project.uploads.length === 0 && <div className="text-muted-foreground">없음</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">점수 상위 TOP 5</CardTitle></CardHeader>
          <CardContent className="text-xs space-y-1">
            {top5.map((a, i) => (
              <div key={a.id} className="flex justify-between">
                <span>{i + 1}. {a.name} ({a.brand})</span>
                <span className="font-medium">{a.totalScore || "—"}</span>
              </div>
            ))}
            {top5.length === 0 && <div className="text-muted-foreground">없음</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
