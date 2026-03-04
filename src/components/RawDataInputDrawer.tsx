import { useState, useEffect, useMemo, useCallback, useRef, type RefObject } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Plus, Trash2, Check, Search, Lock, Unlock, Save, RotateCcw } from "lucide-react";
import { NewCohortModal } from "@/components/NewCohortModal";
import { toast } from "sonner";
import {
  type RawCohort, loadRawCohorts, upsertRawCohort, deleteRawCohort, makeId, getNextCohortNo,
} from "@/lib/rawCohortStore";
import {
  type PlatformCost, loadPlatformCosts, upsertPlatformCost, deletePlatformCost,
  generateCostId, getRecentPlatformNames, getCostsForCohort,
} from "@/lib/platformCostStore";
import { useRawCohortStore } from "@/hooks/useRawCohortStore";
import { usePlatformCosts } from "@/hooks/usePlatformCosts";
import { formatWonCompact } from "@/lib/format";
import { makeTargetKey, loadAllTargets, upsertTarget, deleteTarget } from "@/lib/targetStore";
import type { CourseTargets } from "@/lib/types";

type TabType = "cohorts" | "costs" | "targets";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultInstructor?: string;
  defaultCourse?: string;
  defaultCohortNo?: number;
  defaultTab?: TabType;
}

function parseNum(v: string): number {
  return Number(v.replace(/[^0-9.-]/g, "")) || 0;
}
function fmtInput(v: number): string {
  return v.toLocaleString("ko-KR");
}

type StatusFilter = "all" | "active" | "closed" | "planned";

export function RawDataInputDrawer({ open, onOpenChange, defaultInstructor, defaultCourse, defaultCohortNo, defaultTab }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab ?? "cohorts");

  useEffect(() => {
    if (open && defaultTab) setActiveTab(defaultTab);
  }, [open, defaultTab]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-hidden p-0 flex flex-col overflow-x-hidden" side="right">
        <SheetHeader className="px-4 pt-4 pb-2 border-b shrink-0">
          <SheetTitle className="text-sm">원데이터 입력</SheetTitle>
          <SheetDescription className="text-[11px]">
            기수별 원천 데이터, 비용, 목표를 통합 관리하세요.
          </SheetDescription>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="mt-1">
            <TabsList className="h-7 p-0.5 bg-muted">
              <TabsTrigger value="cohorts" className="text-xs h-6 px-3">기수 원데이터</TabsTrigger>
              <TabsTrigger value="costs" className="text-xs h-6 px-3">비용 입력 (L1)</TabsTrigger>
              <TabsTrigger value="targets" className="text-xs h-6 px-3">목표 설정</TabsTrigger>
            </TabsList>
          </Tabs>
        </SheetHeader>

        {activeTab === "cohorts" ? (
          <CohortTab defaultInstructor={defaultInstructor} defaultCourse={defaultCourse} />
        ) : activeTab === "costs" ? (
          <CostTab defaultInstructor={defaultInstructor} defaultCourse={defaultCourse} defaultCohortNo={defaultCohortNo} />
        ) : (
          <TargetsTab defaultInstructor={defaultInstructor} defaultCourse={defaultCourse} defaultCohortNo={defaultCohortNo} />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ═══════════════════════ Cohort Tab (기존) ═══════════════════════
function CohortTab({ defaultInstructor, defaultCourse }: { defaultInstructor?: string; defaultCourse?: string }) {
  const rawCohorts = useRawCohortStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [form, setForm] = useState<RawCohort | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    if (rawCohorts.length > 0 && !selectedId) setSelectedId(rawCohorts[0].id);
  }, [rawCohorts.length]);

  useEffect(() => {
    if (!selectedId) { setForm(null); return; }
    const found = rawCohorts.find((c) => c.id === selectedId);
    if (found) setForm({ ...found });
  }, [selectedId, rawCohorts]);

  const filtered = useMemo(() => {
    let list = [...rawCohorts];
    if (statusFilter !== "all") list = list.filter((c) => c.status === statusFilter);
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter((c) => c.instructor_name.toLowerCase().includes(q) || c.course_title.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.instructor_name.localeCompare(b.instructor_name) || a.course_title.localeCompare(b.course_title) || a.cohort_no - b.cohort_no);
  }, [rawCohorts, statusFilter, searchText]);

  const autoSave = useCallback((updated: RawCohort) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const newId = makeId(updated.instructor_name, updated.course_title, updated.cohort_no);
      if (newId !== updated.id) {
        deleteRawCohort(updated.id);
        updated = { ...updated, id: newId };
        setSelectedId(newId);
      }
      upsertRawCohort(updated);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 400);
  }, []);

  const updateField = useCallback(<K extends keyof RawCohort>(key: K, value: RawCohort[K]) => {
    setForm((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [key]: value };
      autoSave(updated);
      return updated;
    });
  }, [autoSave]);

  const warnings = useMemo(() => {
    if (!form) return [];
    const ws: string[] = [];
    if (form.applied > form.leads && form.leads > 0) ws.push("지원 수가 리드보다 큽니다");
    if (form.students > form.applied && form.applied > 0) ws.push("결제 수가 지원 수보다 큽니다");
    return ws;
  }, [form]);

  const hardErrors = useMemo(() => {
    if (!form) return [];
    const errs: string[] = [];
    if (form.revenue < 0) errs.push("매출은 0 이상");
    if (form.students < 0) errs.push("수강생은 0 이상");
    if (form.leads < 0) errs.push("리드는 0 이상");
    if (form.applied < 0) errs.push("지원은 0 이상");
    return errs;
  }, [form]);

  const conversion = form && form.applied > 0 ? ((form.students / form.applied) * 100).toFixed(1) : "—";
  const conversionSec = form && form.leads > 0 ? ((form.students / form.leads) * 100).toFixed(1) : "—";

  const handleNewCohortCreated = (id: string) => {
    setSelectedId(id);
  };

  const handleDelete = () => {
    if (!form) return;
    deleteRawCohort(form.id);
    setSelectedId(null);
    toast.success(`삭제됨`);
  };

  const numField = (label: string, key: "revenue" | "leads" | "applied" | "students", suffix?: string) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        value={form ? fmtInput(form[key]) : ""}
        onChange={(e) => { const n = parseNum(e.target.value); if (n >= 0) updateField(key, n); }}
        onBlur={() => form && updateField(key, form[key])}
        className="tabular-nums h-8 text-xs w-full" inputMode="numeric"
      />
      {suffix && form && <p className="text-[10px] text-muted-foreground break-words">{suffix}: {formatWonCompact(form[key])}</p>}
    </div>
  );

  return (
    <div className="flex flex-1 overflow-hidden">
      <NewCohortModal
        open={showNewModal}
        onOpenChange={setShowNewModal}
        rawCohorts={rawCohorts}
        defaultInstructor={defaultInstructor}
        defaultCourse={defaultCourse}
        onCreated={handleNewCohortCreated}
      />
      {/* Left: list */}
      <div className="w-[55%] min-w-0 border-r flex flex-col overflow-hidden">
        <div className="flex items-center gap-1.5 p-2 border-b">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowNewModal(true)}><Plus className="h-3 w-3" /> 새 기수</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={handleDelete} disabled={!form}><Trash2 className="h-3 w-3" /></Button>
          {saveStatus === "saved" && <Badge variant="secondary" className="text-[10px] h-5 gap-1 ml-auto"><Check className="h-3 w-3" /> 저장됨</Badge>}
        </div>
        <div className="flex items-center gap-1.5 p-2 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input placeholder="강사/과정 검색" value={searchText} onChange={(e) => setSearchText(e.target.value)} className="h-7 text-xs pl-7" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="h-7 w-20 text-[10px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="active">운영중</SelectItem>
              <SelectItem value="closed">종료</SelectItem>
              <SelectItem value="planned">계획</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50">
                <TableHead className="h-7 text-[9px] uppercase tracking-widest px-2">강사</TableHead>
                <TableHead className="h-7 text-[9px] uppercase tracking-widest px-2">과정</TableHead>
                <TableHead className="h-7 text-[9px] uppercase tracking-widest px-2 text-center">기수</TableHead>
                <TableHead className="h-7 text-[9px] uppercase tracking-widest px-2">상태</TableHead>
                <TableHead className="h-7 text-[9px] uppercase tracking-widest px-2 text-right">매출</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const isSelected = c.id === selectedId;
                const hasWarn = (c.applied > c.leads && c.leads > 0) || (c.students > c.applied && c.applied > 0);
                return (
                  <TableRow key={c.id} className={`cursor-pointer border-b border-border/30 transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/30"}`} onClick={() => setSelectedId(c.id)}>
                    <TableCell className="py-1.5 px-2 text-[11px]">{c.instructor_name}</TableCell>
                    <TableCell className="py-1.5 px-2 text-[11px] max-w-[120px] truncate">{c.course_title}</TableCell>
                    <TableCell className="py-1.5 px-2 text-[11px] text-center">{c.cohort_no}기{hasWarn && <span className="ml-1 text-yellow-500">⚠</span>}</TableCell>
                    <TableCell className="py-1.5 px-2">
                      <Badge variant={c.status === "active" ? "default" : c.status === "closed" ? "secondary" : "outline"} className="text-[9px] h-4 px-1">
                        {c.status === "active" ? "운영중" : c.status === "closed" ? "종료" : "계획"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5 px-2 text-[11px] text-right tabular-nums">{formatWonCompact(c.revenue)}</TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">데이터가 없습니다</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Right: form */}
      <div className="w-[45%] min-w-0 overflow-y-auto overflow-x-hidden p-3">
        {form ? (
          <div className="space-y-3">
            {hardErrors.length > 0 && (
              <div className="rounded-md border border-destructive/50 bg-destructive/5 p-2 space-y-0.5">
                {hardErrors.map((e, i) => <p key={i} className="text-[10px] text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3 shrink-0" /> {e}</p>)}
              </div>
            )}
            {warnings.length > 0 && (
              <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-2 space-y-0.5">
                {warnings.map((w, i) => <p key={i} className="text-[10px] text-yellow-700 dark:text-yellow-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3 shrink-0" /> {w}</p>)}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">강사</Label><Input value={form.instructor_name} onChange={(e) => updateField("instructor_name", e.target.value)} className="h-8 text-xs w-full" /></div>
              <div className="space-y-1"><Label className="text-xs">과정</Label><Input value={form.course_title} onChange={(e) => updateField("course_title", e.target.value)} className="h-8 text-xs w-full truncate" /></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1"><Label className="text-xs">기수</Label><Input type="number" min={1} value={form.cohort_no} onChange={(e) => updateField("cohort_no", parseInt(e.target.value) || 1)} className="h-8 text-xs tabular-nums w-full" /></div>
              <div className="space-y-1">
                <Label className="text-xs">상태</Label>
                <Select value={form.status} onValueChange={(v) => updateField("status", v as RawCohort["status"])}>
                  <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="planned">계획</SelectItem><SelectItem value="active">운영중</SelectItem><SelectItem value="closed">종료</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">시작일</Label><Input type="date" value={form.start_date} onChange={(e) => updateField("start_date", e.target.value)} className="h-8 text-xs w-full" /></div>
            </div>
            {numField("매출 (원)", "revenue", "표시")}
            <div className="grid grid-cols-3 gap-2">
              {numField("리드", "leads")}
              {numField("지원", "applied")}
              {numField("수강생", "students")}
            </div>
            <div className="rounded-md bg-muted p-2.5 space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">자동 계산</p>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">전환율 (결제/지원)</span><span className="font-medium tabular-nums">{conversion}%</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">참고 전환율 (결제/리드)</span><span className="font-medium tabular-nums">{conversionSec}%</span></div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center"><p className="text-xs text-muted-foreground">좌측 목록에서 기수를 선택하세요</p></div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════ Cost Tab (레벨1 비용) ═══════════════════════
function CostTab({ defaultInstructor, defaultCourse, defaultCohortNo }: { defaultInstructor?: string; defaultCourse?: string; defaultCohortNo?: number }) {
  const rawCohorts = useRawCohortStore();
  const platformCosts = usePlatformCosts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [form, setForm] = useState<PlatformCost | null>(null);
  const newRowRef = useRef<string | null>(null);

  // Locked filter state
  const [lockedFilter, setLockedFilter] = useState<{
    instructor: string; course: string; cohortNo: number;
  } | null>(null);

  // Resolve default instructor/course names
  const defaultInstName = rawCohorts.find((c) => `inst-${c.instructor_name}` === defaultInstructor)?.instructor_name;
  const defaultCourseName = rawCohorts.find((c) => `course-${c.course_title}` === defaultCourse)?.course_title;

  // Active filter: locked filter takes priority over defaults
  const activeInstName = lockedFilter?.instructor ?? defaultInstName;
  const activeCourseName = lockedFilter?.course ?? defaultCourseName;
  const activeCohortNo = lockedFilter?.cohortNo ?? null;

  // Filter costs
  const filteredCosts = useMemo(() => {
    let list = [...platformCosts];
    if (activeInstName) list = list.filter((c) => c.instructor_name === activeInstName);
    if (activeCourseName) list = list.filter((c) => c.course_title === activeCourseName);
    if (activeCohortNo != null) list = list.filter((c) => c.cohort_no === activeCohortNo);
    return list.sort((a, b) => a.cohort_no - b.cohort_no || a.platform_name.localeCompare(b.platform_name));
  }, [platformCosts, activeInstName, activeCourseName, activeCohortNo]);

  // Auto-select first if nothing selected
  useEffect(() => {
    if (!selectedId && filteredCosts.length > 0) setSelectedId(filteredCosts[0].id);
  }, [filteredCosts.length, selectedId]);

  // Sync form from store
  useEffect(() => {
    if (!selectedId) { setForm(null); return; }
    const found = platformCosts.find((c) => c.id === selectedId);
    if (found) setForm({ ...found });
    else setForm(null);
  }, [selectedId, platformCosts]);

  // Scroll to newly created row
  useEffect(() => {
    if (newRowRef.current) {
      const el = document.getElementById(`cost-row-${newRowRef.current}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      newRowRef.current = null;
    }
  }, [filteredCosts]);

  const autoSave = useCallback((updated: PlatformCost) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      upsertPlatformCost(updated);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 400);
  }, []);

  const updateField = useCallback(<K extends keyof PlatformCost>(key: K, value: PlatformCost[K]) => {
    setForm((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [key]: value };
      autoSave(updated);
      return updated;
    });
  }, [autoSave]);

  const recentPlatforms = useMemo(() => getRecentPlatformNames(), [platformCosts]);

  // Available cohorts for dropdown
  const availableCohorts = useMemo(() => {
    let list = [...rawCohorts];
    if (activeInstName) list = list.filter((c) => c.instructor_name === activeInstName);
    if (activeCourseName) list = list.filter((c) => c.course_title === activeCourseName);
    return list.sort((a, b) => a.cohort_no - b.cohort_no);
  }, [rawCohorts, activeInstName, activeCourseName]);

  const handleAddNew = () => {
    const instName = (activeInstName ?? rawCohorts[0]?.instructor_name ?? "").trim();
    const courseName = (activeCourseName ?? rawCohorts[0]?.course_title ?? "").trim();
    const cohortNo = defaultCohortNo ?? availableCohorts[availableCohorts.length - 1]?.cohort_no ?? 1;

    const newCost: PlatformCost = {
      id: generateCostId(),
      instructor_name: instName,
      course_title: courseName,
      cohort_no: cohortNo,
      platform_name: recentPlatforms[0] ?? "N잡연구소",
      fee_amount: 0,
      ad_cost_amount: 0,
      note: "",
      updated_at: new Date().toISOString(),
    };

    // Lock filter to this cohort so the new record is guaranteed visible
    setLockedFilter({ instructor: instName, course: courseName, cohortNo });

    upsertPlatformCost(newCost);
    setSelectedId(newCost.id);
    newRowRef.current = newCost.id;
    toast.success("비용 레코드 추가됨");
  };

  const handleDelete = () => {
    if (!form) return;
    deletePlatformCost(form.id);
    setSelectedId(null);
    toast.success("비용 삭제됨");
  };

  const [platformInput, setPlatformInput] = useState("");

  useEffect(() => {
    if (form) setPlatformInput(form.platform_name);
  }, [form?.id]);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left: cost list */}
      <div className="w-[50%] min-w-0 border-r flex flex-col overflow-hidden">
        <div className="flex items-center gap-1.5 p-2 border-b">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleAddNew}><Plus className="h-3 w-3" /> 새 비용</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={handleDelete} disabled={!form}><Trash2 className="h-3 w-3" /></Button>
          {saveStatus === "saved" && <Badge variant="secondary" className="text-[10px] h-5 gap-1 ml-auto"><Check className="h-3 w-3" /> 저장됨</Badge>}
        </div>

        {/* Locked filter indicator */}
        {lockedFilter && (
          <div className="flex items-center gap-1.5 px-2 py-1.5 border-b bg-muted/50">
            <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground truncate">
              {lockedFilter.instructor} · {lockedFilter.cohortNo}기 고정
            </span>
            <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 ml-auto gap-1 text-muted-foreground hover:text-foreground" onClick={() => setLockedFilter(null)}>
              <Unlock className="h-3 w-3" /> 해제
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50">
                <TableHead className="h-7 text-[9px] uppercase tracking-widest px-2">플랫폼</TableHead>
                <TableHead className="h-7 text-[9px] uppercase tracking-widest px-2 text-center">기수</TableHead>
                <TableHead className="h-7 text-[9px] uppercase tracking-widest px-2 text-right">수수료</TableHead>
                <TableHead className="h-7 text-[9px] uppercase tracking-widest px-2 text-right">광고비</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCosts.map((c) => (
                <TableRow
                  key={c.id}
                  id={`cost-row-${c.id}`}
                  className={`cursor-pointer border-b border-border/30 transition-colors ${c.id === selectedId ? "bg-primary/5" : "hover:bg-muted/30"}`}
                  onClick={() => setSelectedId(c.id)}
                >
                  <TableCell className="py-1.5 px-2 text-[11px]">{c.platform_name}</TableCell>
                  <TableCell className="py-1.5 px-2 text-[11px] text-center">{c.cohort_no}기</TableCell>
                  <TableCell className="py-1.5 px-2 text-[11px] text-right tabular-nums">{formatWonCompact(c.fee_amount)}</TableCell>
                  <TableCell className="py-1.5 px-2 text-[11px] text-right tabular-nums">{formatWonCompact(c.ad_cost_amount)}</TableCell>
                </TableRow>
              ))}
              {filteredCosts.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">비용 데이터가 없습니다</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Right: cost form */}
      <div className="w-[50%] min-w-0 overflow-y-auto overflow-x-hidden p-3">
        {form ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">플랫폼</Label>
              <div className="space-y-1">
                <Input
                  value={platformInput}
                  onChange={(e) => { setPlatformInput(e.target.value); updateField("platform_name", e.target.value); }}
                  placeholder="예: N잡연구소"
                  className="h-8 text-xs"
                />
                {recentPlatforms.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {recentPlatforms.map((p) => (
                      <button key={p} type="button" onClick={() => { setPlatformInput(p); updateField("platform_name", p); }}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:bg-accent transition-colors">{p}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">강사</Label>
                <Input value={form.instructor_name} onChange={(e) => updateField("instructor_name", e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">과정</Label>
                <Input value={form.course_title} onChange={(e) => updateField("course_title", e.target.value)} className="h-8 text-xs" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">기수</Label>
              {availableCohorts.length > 0 ? (
                <Select value={String(form.cohort_no)} onValueChange={(v) => updateField("cohort_no", Number(v))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableCohorts.map((c) => (
                      <SelectItem key={c.cohort_no} value={String(c.cohort_no)}>{c.cohort_no}기</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input type="number" min={1} value={form.cohort_no} onChange={(e) => updateField("cohort_no", parseInt(e.target.value) || 1)} className="h-8 text-xs tabular-nums" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">수수료 (원)</Label>
                <Input value={fmtInput(form.fee_amount)} onChange={(e) => { const n = parseNum(e.target.value); if (n >= 0) updateField("fee_amount", n); }} className="h-8 text-xs tabular-nums" inputMode="numeric" />
                <p className="text-[10px] text-muted-foreground">{formatWonCompact(form.fee_amount)}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">광고비 (원)</Label>
                <Input value={fmtInput(form.ad_cost_amount)} onChange={(e) => { const n = parseNum(e.target.value); if (n >= 0) updateField("ad_cost_amount", n); }} className="h-8 text-xs tabular-nums" inputMode="numeric" />
                <p className="text-[10px] text-muted-foreground">{formatWonCompact(form.ad_cost_amount)}</p>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">메모 (선택)</Label>
              <Input value={form.note} onChange={(e) => updateField("note", e.target.value)} placeholder="정산 관련 메모" className="h-8 text-xs" />
            </div>

            <div className="rounded-md bg-muted p-2.5">
              <p className="text-[10px] text-muted-foreground">
                💡 총매출은 대시보드 매출을 사용하며, 수수료/광고비만 입력하면 순이익이 자동 계산됩니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center"><p className="text-xs text-muted-foreground">"새 비용" 버튼을 눌러 입력하세요</p></div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════ Targets Tab (목표 설정 - 기수별 B안) ═══════════════════════

function TargetsTab({ defaultInstructor, defaultCourse, defaultCohortNo }: { defaultInstructor?: string; defaultCourse?: string; defaultCohortNo?: number }) {
  const rawCohorts = useRawCohortStore();

  // Extract unique instructors
  const instructors = useMemo(() => [...new Set(rawCohorts.map((c) => c.instructor_name))].sort(), [rawCohorts]);

  // Selected instructor
  const defaultInstName = rawCohorts.find((c) => `inst-${c.instructor_name}` === defaultInstructor)?.instructor_name ?? instructors[0] ?? "";
  const [selInstructor, setSelInstructor] = useState(defaultInstName);

  // Courses for selected instructor
  const coursesForInst = useMemo(
    () => [...new Set(rawCohorts.filter((c) => c.instructor_name === selInstructor).map((c) => c.course_title))].sort(),
    [rawCohorts, selInstructor]
  );
  const defaultCourseName = rawCohorts.find((c) => `course-${c.course_title}` === defaultCourse && c.instructor_name === selInstructor)?.course_title ?? coursesForInst[0] ?? "";
  const [selCourse, setSelCourse] = useState(defaultCourseName);

  // Cohorts for selected instructor + course
  const cohortsForCourse = useMemo(
    () => rawCohorts.filter((c) => c.instructor_name === selInstructor && c.course_title === selCourse).map((c) => c.cohort_no).sort((a, b) => a - b),
    [rawCohorts, selInstructor, selCourse]
  );
  const defaultCohNo = defaultCohortNo && cohortsForCourse.includes(defaultCohortNo) ? defaultCohortNo : cohortsForCourse[cohortsForCourse.length - 1] ?? 1;
  const [selCohortNo, setSelCohortNo] = useState(defaultCohNo);

  // Reset dependent when parent changes
  useEffect(() => {
    if (!coursesForInst.includes(selCourse)) setSelCourse(coursesForInst[0] ?? "");
  }, [selInstructor, coursesForInst]);
  useEffect(() => {
    if (!cohortsForCourse.includes(selCohortNo)) setSelCohortNo(cohortsForCourse[cohortsForCourse.length - 1] ?? 1);
  }, [selCourse, cohortsForCourse]);

  // Sync defaults when drawer opens with new context
  useEffect(() => {
    const inst = rawCohorts.find((c) => `inst-${c.instructor_name}` === defaultInstructor)?.instructor_name;
    if (inst) setSelInstructor(inst);
  }, [defaultInstructor]);
  useEffect(() => {
    const course = rawCohorts.find((c) => `course-${c.course_title}` === defaultCourse && c.instructor_name === selInstructor)?.course_title;
    if (course) setSelCourse(course);
  }, [defaultCourse]);
  useEffect(() => {
    if (defaultCohortNo && cohortsForCourse.includes(defaultCohortNo)) setSelCohortNo(defaultCohortNo);
  }, [defaultCohortNo]);

  const key = makeTargetKey(selInstructor, selCourse, selCohortNo);

  const [revenue, setRevenue] = useState("");
  const [students, setStudents] = useState("");
  const [conversion, setConversion] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "dirty">("idle");

  // Load on key change
  useEffect(() => {
    const all = loadAllTargets();
    const t = all[key] ?? null;
    setRevenue(t?.revenue_target != null ? String(t.revenue_target) : "");
    setStudents(t?.students_target != null ? String(t.students_target) : "");
    setConversion(t?.conversion_target != null ? String(t.conversion_target) : "");
    setSaveStatus("idle");
  }, [key]);

  const markDirty = () => setSaveStatus("dirty");

  const handleSave = () => {
    const convNum = conversion ? Number(conversion) : null;
    if (convNum != null && (convNum < 0 || convNum > 100)) {
      toast.error("전환율은 0~100% 범위로 입력하세요.");
      return;
    }
    if (revenue && Number(revenue) < 0) { toast.error("매출 목표는 0 이상이어야 합니다."); return; }
    if (students && Number(students) < 0) { toast.error("수강생 목표는 0 이상이어야 합니다."); return; }

    const all = loadAllTargets();
    all[key] = {
      revenue_target: revenue ? Number(revenue) : null,
      students_target: students ? Number(students) : null,
      conversion_target: convNum,
    };
    saveAllTargets(all);
    setSaveStatus("saved");
    toast.success("목표 저장됨");
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const handleClear = () => {
    const all = loadAllTargets();
    delete all[key];
    saveAllTargets(all);
    setRevenue("");
    setStudents("");
    setConversion("");
    setSaveStatus("idle");
    toast.success("목표 삭제됨");
  };

  const handleResetToDefault = () => {
    const inst = rawCohorts.find((c) => `inst-${c.instructor_name}` === defaultInstructor)?.instructor_name;
    const course = rawCohorts.find((c) => `course-${c.course_title}` === defaultCourse && c.instructor_name === (inst ?? selInstructor))?.course_title;
    if (inst) setSelInstructor(inst);
    if (course) setSelCourse(course);
    if (defaultCohortNo) setSelCohortNo(defaultCohortNo);
  };

  const hasValues = revenue || students || conversion;

  if (instructors.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-xs text-muted-foreground">기수 원데이터가 없습니다. 먼저 기수를 추가해주세요.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-md mx-auto space-y-5">
        {/* Target scope selectors */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">대상 선택</p>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground" onClick={handleResetToDefault}>
              <RotateCcw className="h-3 w-3 mr-1" /> 현재 대시보드로
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">강사</Label>
              <Select value={selInstructor} onValueChange={setSelInstructor}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {instructors.map((inst) => <SelectItem key={inst} value={inst}>{inst}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">과정</Label>
              <Select value={selCourse} onValueChange={setSelCourse}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {coursesForInst.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">기수</Label>
              <Select value={String(selCohortNo)} onValueChange={(v) => setSelCohortNo(Number(v))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cohortsForCourse.map((no) => <SelectItem key={no} value={String(no)}>{no}기</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="target-revenue" className="text-xs font-medium">목표 매출 (원)</Label>
            <Input
              id="target-revenue" type="number" min="0" placeholder="예: 300000000"
              value={revenue} onChange={(e) => { setRevenue(e.target.value); markDirty(); }}
              className="h-9 text-sm tabular-nums"
            />
            <p className="text-[10px] text-muted-foreground">원 단위로 입력 (예: 3억 = 300000000)</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="target-students" className="text-xs font-medium">목표 수강생 (명)</Label>
            <Input
              id="target-students" type="number" min="0" placeholder="예: 100"
              value={students} onChange={(e) => { setStudents(e.target.value); markDirty(); }}
              className="h-9 text-sm tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="target-conversion" className="text-xs font-medium">목표 전환율 (%, 결제/지원)</Label>
            <Input
              id="target-conversion" type="number" step="0.1" min="0" max="100" placeholder="예: 10"
              value={conversion} onChange={(e) => { setConversion(e.target.value); markDirty(); }}
              className="h-9 text-sm tabular-nums"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleSave} className="flex-1 h-9 text-xs gap-1.5">
            <Save className="h-3 w-3" /> 저장
          </Button>
          {saveStatus === "saved" && <Badge variant="secondary" className="text-[10px] h-5 gap-1"><Check className="h-3 w-3" /> 저장됨</Badge>}
          {saveStatus === "dirty" && <Badge variant="outline" className="text-[10px] h-5 border-yellow-500/50 text-yellow-600 dark:text-yellow-400">미저장</Badge>}
        </div>

        {hasValues && (
          <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-muted-foreground hover:text-destructive gap-1.5" onClick={handleClear}>
            <RotateCcw className="h-3 w-3" /> 이 기수 목표 삭제
          </Button>
        )}

        <div className="rounded-md bg-muted p-2.5">
          <p className="text-[10px] text-muted-foreground">
            💡 목표는 강사+과정+기수 단위로 저장됩니다. 대시보드에서 선택한 기수의 목표 달성률이 표시됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
