import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Plus, Trash2, Check, Search, Save, CalendarIcon, RotateCcw, Target } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
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
import { formatWonFull } from "@/lib/format";
import { makeTargetKey, loadAllTargets, upsertTarget, deleteTarget } from "@/lib/targetStore";
import { useTargets } from "@/hooks/useTargets";
import type { CourseTargets } from "@/lib/types";

type TabType = "cohorts" | "costs";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultInstructor?: string;
  defaultCourse?: string;
  defaultCohortNo?: number;
  defaultTab?: TabType | "targets";
}

function parseNum(v: string): number {
  return Number(v.replace(/[^0-9.-]/g, "")) || 0;
}
function fmtInput(v: number): string {
  return v.toLocaleString("ko-KR");
}

type StatusFilter = "all" | "active" | "closed" | "planned";

// ── Status color helpers ──
const STATUS_COLORS = {
  planned: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  closed: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
} as const;

const STATUS_DOT = {
  planned: "bg-amber-500",
  active: "bg-emerald-500",
  closed: "bg-red-500",
} as const;

const STATUS_LABEL: Record<string, string> = {
  planned: "계획",
  active: "운영중",
  closed: "종료",
};

export function RawDataInputDrawer({ open, onOpenChange, defaultInstructor, defaultCourse, defaultCohortNo, defaultTab }: Props) {
  // Map legacy "targets" tab to "cohorts"
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab === "targets" ? "cohorts" : (defaultTab as TabType) ?? "cohorts");

  useEffect(() => {
    if (open && defaultTab) setActiveTab(defaultTab === "targets" ? "cohorts" : defaultTab as TabType);
  }, [open, defaultTab]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-hidden p-0 flex flex-col overflow-x-hidden" side="right">
        <SheetHeader className="px-4 pt-4 pb-2 border-b shrink-0">
          <SheetTitle className="text-sm">원데이터 입력</SheetTitle>
          <SheetDescription className="text-[11px]">
            기수별 원천 데이터와 비용을 통합 관리하세요.
          </SheetDescription>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="mt-1">
            <TabsList className="h-7 p-0.5 bg-muted">
              <TabsTrigger value="cohorts" className="text-xs h-6 px-3">기수 원데이터</TabsTrigger>
              <TabsTrigger value="costs" className="text-xs h-6 px-3">비용 입력 (L1)</TabsTrigger>
            </TabsList>
          </Tabs>
        </SheetHeader>

        {activeTab === "cohorts" ? (
          <CohortTab defaultInstructor={defaultInstructor} defaultCourse={defaultCourse} />
        ) : (
          <CostTab defaultInstructor={defaultInstructor} defaultCourse={defaultCourse} defaultCohortNo={defaultCohortNo} />
        )}
      </SheetContent>
    </Sheet>
  );
}

const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

function DatePickerField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const dateObj = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const isValid = dateObj && !isNaN(dateObj.getTime());
  const dayOfWeek = isValid ? WEEKDAYS_KO[dateObj.getDay()] : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-8 w-full min-w-0 justify-start text-left font-normal px-2 gap-1.5",
            !isValid && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-3 w-3 shrink-0 opacity-60" />
          <span className="truncate text-xs">
            {isValid ? `${format(dateObj, "yyyy. MM. dd.")} (${dayOfWeek})` : "시작일 선택"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={isValid ? dateObj : undefined}
          onSelect={(d) => {
            if (d) {
              onChange(format(d, "yyyy-MM-dd"));
            }
            setOpen(false);
          }}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

// ── Status-colored Select Trigger ──
function StatusSelectTrigger({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium", STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? "")}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", STATUS_DOT[status as keyof typeof STATUS_DOT] ?? "bg-muted-foreground")} />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

// ── Inline Targets Section (기수별 목표 B안) ──
function InlineTargetsSection({ instructorName, courseTitle, cohortNo }: { instructorName: string; courseTitle: string; cohortNo: number }) {
  const { targets } = useTargets(instructorName, courseTitle, cohortNo);

  const [revenue, setRevenue] = useState("");
  const [students, setStudents] = useState("");
  const [conversion, setConversion] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "dirty">("idle");

  const key = makeTargetKey(instructorName, courseTitle, cohortNo);

  // Sync form when targets change (from store subscription)
  useEffect(() => {
    setRevenue(targets?.revenue_target != null ? String(targets.revenue_target) : "");
    setStudents(targets?.students_target != null ? String(targets.students_target) : "");
    setConversion(targets?.conversion_target != null ? String(targets.conversion_target) : "");
    setSaveStatus("idle");
  }, [targets?.revenue_target, targets?.students_target, targets?.conversion_target]);

  const markDirty = () => setSaveStatus("dirty");

  const handleSave = () => {
    const convNum = conversion ? Number(conversion) : null;
    if (convNum != null && (convNum < 0 || convNum > 100)) {
      toast.error("전환율은 0~100% 범위로 입력하세요.");
      return;
    }
    if (revenue && Number(revenue) < 0) { toast.error("매출 목표는 0 이상이어야 합니다."); return; }
    if (students && Number(students) < 0) { toast.error("수강생 목표는 0 이상이어야 합니다."); return; }

    upsertTarget(key, {
      revenue_target: revenue ? Number(revenue) : null,
      students_target: students ? Number(students) : null,
      conversion_target: convNum,
    });
    setSaveStatus("saved");
    toast.success("목표 저장됨");
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const handleClear = () => {
    deleteTarget(key);
    setRevenue("");
    setStudents("");
    setConversion("");
    setSaveStatus("idle");
    toast.success("목표 삭제됨");
  };

  const hasValues = revenue || students || conversion;
  const revenueNum = revenue ? Number(revenue) : 0;

  return (
    <div className="rounded-md border border-border/60 p-2.5 space-y-2.5">
      <div className="flex items-center gap-1.5">
        <Target className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">기수 목표 (선택)</p>
        {!targets && (
          <span className="text-[10px] text-muted-foreground ml-auto">목표 미설정</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">목표 매출 (원)</Label>
          <Input
            type="number" min="0" placeholder="300000000"
            value={revenue} onChange={(e) => { setRevenue(e.target.value); markDirty(); }}
            className="h-7 text-xs tabular-nums"
          />
          {revenueNum > 0 && <p className="text-[10px] text-muted-foreground">{formatWonFull(revenueNum)}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">목표 수강생</Label>
          <Input
            type="number" min="0" placeholder="50"
            value={students} onChange={(e) => { setStudents(e.target.value); markDirty(); }}
            className="h-7 text-xs tabular-nums"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">목표 전환율 (%)</Label>
          <Input
            type="number" step="0.1" min="0" max="100" placeholder="15"
            value={conversion} onChange={(e) => { setConversion(e.target.value); markDirty(); }}
            className="h-7 text-xs tabular-nums"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button onClick={handleSave} size="sm" className="h-7 text-[11px] gap-1 flex-1">
          <Save className="h-3 w-3" /> 목표 저장
        </Button>
        {hasValues && (
          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-muted-foreground hover:text-destructive gap-1" onClick={handleClear}>
            <RotateCcw className="h-3 w-3" /> 삭제
          </Button>
        )}
        {saveStatus === "saved" && <Badge variant="secondary" className="text-[9px] h-5 gap-1"><Check className="h-3 w-3" /> 저장됨</Badge>}
        {saveStatus === "dirty" && <Badge variant="outline" className="text-[9px] h-5 border-amber-500/50 text-amber-600 dark:text-amber-400">미저장</Badge>}
      </div>
    </div>
  );
}

// ═══════════════════════ Cohort Tab ═══════════════════════
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
      {suffix && form && <p className="text-[10px] text-muted-foreground break-words">{suffix}: {formatWonFull(form[key])}</p>}
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
      <div className="w-[45%] min-w-0 border-r flex flex-col overflow-hidden">
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
                    <TableCell className="py-1.5 px-2 text-[11px] text-center">{c.cohort_no}기{hasWarn && <span className="ml-1 text-amber-500">⚠</span>}</TableCell>
                    <TableCell className="py-1.5 px-2">
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-medium", STATUS_COLORS[c.status])}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[c.status])} />
                        {STATUS_LABEL[c.status]}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-xs text-muted-foreground">데이터가 없습니다</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Right: form */}
      <div className="w-[55%] min-w-0 overflow-y-auto overflow-x-hidden p-3">
        {form ? (
          <div className="space-y-3">
            {hardErrors.length > 0 && (
              <div className="rounded-md border border-destructive/50 bg-destructive/5 p-2 space-y-0.5">
                {hardErrors.map((e, i) => <p key={i} className="text-[10px] text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3 shrink-0" /> {e}</p>)}
              </div>
            )}
            {warnings.length > 0 && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2 space-y-0.5">
                {warnings.map((w, i) => <p key={i} className="text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3 shrink-0" /> {w}</p>)}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">강사</Label><Input value={form.instructor_name} onChange={(e) => updateField("instructor_name", e.target.value)} className="h-8 text-xs w-full" /></div>
              <div className="space-y-1"><Label className="text-xs">과정</Label><Input value={form.course_title} onChange={(e) => updateField("course_title", e.target.value)} className="h-8 text-xs w-full truncate" /></div>
            </div>
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-2 space-y-1 min-w-0"><Label className="text-xs">기수</Label><Input type="number" min={1} value={form.cohort_no} onChange={(e) => updateField("cohort_no", parseInt(e.target.value) || 1)} className="h-8 text-xs tabular-nums w-full min-w-0" /></div>
              <div className="col-span-3 space-y-1 min-w-0">
                <Label className="text-xs">상태</Label>
                <Select value={form.status} onValueChange={(v) => updateField("status", v as RawCohort["status"])}>
                  <SelectTrigger className="h-8 text-xs w-full min-w-0 [&>span]:flex [&>span]:items-center">
                    <StatusSelectTrigger status={form.status} />
                  </SelectTrigger>
                  <SelectContent>
                    {(["planned", "active", "closed"] as const).map((s) => (
                      <SelectItem key={s} value={s}>
                        <span className="inline-flex items-center gap-1.5">
                          <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[s])} />
                          {STATUS_LABEL[s]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-7 space-y-1 min-w-0">
                <Label className="text-xs">시작일</Label>
                <DatePickerField value={form.start_date} onChange={(v) => updateField("start_date", v)} />
              </div>
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

            {/* ── Inline Targets Section ── */}
            <InlineTargetsSection
              instructorName={form.instructor_name}
              courseTitle={form.course_title}
              cohortNo={form.cohort_no}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center"><p className="text-xs text-muted-foreground">좌측 목록에서 기수를 선택하세요</p></div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════ New Cost Modal ═══════════════════════

function NewCostModal({ open, onOpenChange, instructor, course, cohortNo, revenue, onCreated }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  instructor: string;
  course: string;
  cohortNo: number;
  revenue: number;
  onCreated: (id: string) => void;
}) {
  const [platformName, setPlatformName] = useState("");
  const [feeRatePct, setFeeRatePct] = useState("");
  const [adCostAmount, setAdCostAmount] = useState("");
  const [note, setNote] = useState("");
  const recentPlatforms = getRecentPlatformNames();

  useEffect(() => {
    if (open) {
      setPlatformName("");
      setFeeRatePct("");
      setAdCostAmount("");
      setNote("");
    }
  }, [open]);

  const rate = Number(feeRatePct) || 0;
  const feeAmount = Math.round(revenue * (rate / 100));
  const ad = parseNum(adCostAmount);
  const totalPreview = feeAmount + ad;

  const handleCreate = () => {
    if (!platformName.trim()) {
      toast.error("플랫폼 이름을 입력하세요.");
      return;
    }
    if (rate < 0 || rate > 100) {
      toast.error("수수료율은 0~100% 범위로 입력하세요.");
      return;
    }
    if (ad < 0) {
      toast.error("광고비는 0 이상이어야 합니다.");
      return;
    }
    const newCost: PlatformCost = {
      id: generateCostId(),
      instructor_name: instructor.trim(),
      course_title: course.trim(),
      cohort_no: Number(cohortNo),
      platform_name: platformName.trim(),
      fee_rate_pct: rate,
      fee_amount: feeAmount,
      ad_cost_amount: ad,
      note: note.trim(),
      updated_at: new Date().toISOString(),
    };
    console.log("[NewCostModal] creating cost", { newId: newCost.id, feeRate: rate, feeAmount, ad });
    upsertPlatformCost(newCost);
    onCreated(newCost.id);
    onOpenChange(false);
    toast.success("비용 레코드가 생성되었습니다");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">새 비용 생성</DialogTitle>
          <DialogDescription className="text-xs">
            {instructor} / {course} {cohortNo}기 · 매출 {formatWonFull(revenue)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs">플랫폼 이름 <span className="text-destructive">*</span></Label>
            <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="h-8 text-xs" placeholder="예: 네이버, 구글, 클래스101" autoFocus />
            {recentPlatforms.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {recentPlatforms.map((name) => (
                  <Button key={name} variant="outline" size="sm" className="h-5 text-[9px] px-1.5" onClick={() => setPlatformName(name)}>
                    {name}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">수수료율 (%)</Label>
            <Input
              type="number" step="0.1" min="0" max="100"
              value={feeRatePct}
              onChange={(e) => setFeeRatePct(e.target.value)}
              className="tabular-nums h-8 text-xs" placeholder="예: 7.5"
            />
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              <p>수수료 금액 = 매출 × 수수료율 = <span className="font-medium text-foreground tabular-nums">{feeAmount.toLocaleString("ko-KR")}원</span></p>
              {revenue === 0 && <p className="text-amber-600 dark:text-amber-400">⚠ 매출이 0이면 수수료가 0으로 계산됩니다</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">광고비 (원)</Label>
            <Input
              value={adCostAmount}
              onChange={(e) => setAdCostAmount(e.target.value)}
              className="tabular-nums h-8 text-xs" inputMode="numeric" placeholder="0"
            />
            {ad > 0 && <p className="text-[10px] text-muted-foreground">{formatWonCompact(ad)}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">메모 (선택)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} className="h-8 text-xs" placeholder="비고" />
          </div>
          {totalPreview > 0 && (
            <div className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
              합계: <span className="font-medium text-foreground tabular-nums">{formatWonCompact(totalPreview)}</span>
              <span className="ml-2">(수수료 {formatWonCompact(feeAmount)} + 광고비 {formatWonCompact(ad)})</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onOpenChange(false)}>취소</Button>
          <Button size="sm" className="h-8 text-xs" onClick={handleCreate}>생성</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════ Cost Tab (레벨1 비용) ═══════════════════════
function CostTab({ defaultInstructor, defaultCourse, defaultCohortNo }: { defaultInstructor?: string; defaultCourse?: string; defaultCohortNo?: number }) {
  const rawCohorts = useRawCohortStore();
  const platformCosts = usePlatformCosts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Cohort selector ───
  const cohortList = useMemo(() => {
    return rawCohorts
      .map((c) => ({ id: c.id, label: `${c.instructor_name} / ${c.course_title} ${c.cohort_no}기`, instructor: c.instructor_name, course: c.course_title, cohortNo: c.cohort_no }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [rawCohorts]);

  const [selCohortId, setSelCohortId] = useState<string>(() => {
    if (defaultInstructor && defaultCourse && defaultCohortNo) {
      const match = rawCohorts.find((c) => `inst-${c.instructor_name}` === defaultInstructor && `course-${c.course_title}` === defaultCourse && c.cohort_no === defaultCohortNo);
      return match?.id ?? cohortList[0]?.id ?? "";
    }
    return cohortList[0]?.id ?? "";
  });

  useEffect(() => {
    if (cohortList.length > 0 && !cohortList.find((c) => c.id === selCohortId)) {
      setSelCohortId(cohortList[0].id);
    }
  }, [cohortList, selCohortId]);

  const costsForCohort = useMemo(() => {
    const sel = cohortList.find((c) => c.id === selCohortId);
    if (!sel) return [];
    return getCostsForCohort(sel.instructor, sel.course, sel.cohortNo);
  }, [selCohortId, platformCosts, cohortList]);

  // Form state
  const [form, setForm] = useState<PlatformCost | null>(null);
  

  useEffect(() => {
    if (costsForCohort.length > 0 && !selectedId) setSelectedId(costsForCohort[0].id);
    if (costsForCohort.length === 0) { setSelectedId(null); setForm(null); }
  }, [costsForCohort.length]);

  useEffect(() => {
    if (!selectedId) { setForm(null); return; }
    const found = costsForCohort.find((c) => c.id === selectedId);
    if (found) setForm({ ...found });
  }, [selectedId, costsForCohort]);

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

  const costListRef = useRef<HTMLDivElement>(null);
  const [showNewCostModal, setShowNewCostModal] = useState(false);

  const handleCostCreated = (newId: string) => {
    setSelectedId(newId);
    requestAnimationFrame(() => {
      const row = costListRef.current?.querySelector(`[data-cost-id="${newId}"]`);
      row?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  const handleDelete = () => {
    if (!form) return;
    deletePlatformCost(form.id);
    setSelectedId(null);
    toast.success("비용 삭제됨");
  };

  const recentPlatforms = getRecentPlatformNames();
  const totalCost = costsForCohort.reduce((sum, c) => sum + c.fee_amount + c.ad_cost_amount, 0);

  const selCohort = cohortList.find((c) => c.id === selCohortId);
  const selRawCohort = rawCohorts.find((c) => c.id === selCohortId);
  const cohortRevenue = selRawCohort?.revenue ?? 0;
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="flex flex-1 overflow-hidden flex-col">
      {/* New cost modal */}
      {selCohort && (
        <NewCostModal
          open={showNewCostModal}
          onOpenChange={setShowNewCostModal}
          instructor={selCohort.instructor}
          course={selCohort.course}
          cohortNo={selCohort.cohortNo}
          revenue={cohortRevenue}
          onCreated={handleCostCreated}
        />
      )}
      {/* Cohort selector */}
      <div className="flex items-center gap-2 p-2 border-b shrink-0">
        <Label className="text-xs text-muted-foreground shrink-0">기수:</Label>
        <Select value={selCohortId} onValueChange={setSelCohortId}>
          <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {cohortList.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Debug panel */}
      <div className="px-2 py-1 border-b shrink-0 flex items-center gap-2">
        <button className="text-[9px] text-muted-foreground underline" onClick={() => setShowDebug((v) => !v)}>
          {showDebug ? "디버그 닫기" : "디버그"}
        </button>
        {showDebug && (
          <span className="text-[9px] text-muted-foreground tabular-nums">
            cohortKey={selCohortId?.slice(0,12)} | store={platformCosts.length} | visible={costsForCohort.length} | selected={selectedId?.slice(0,12) ?? "null"} | rev={cohortRevenue}
          </span>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: cost list */}
        <div className="w-[45%] min-w-0 border-r flex flex-col overflow-hidden">
          <div className="flex items-center gap-1.5 p-2 border-b">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowNewCostModal(true)} disabled={!selCohortId}><Plus className="h-3 w-3" /> 새 비용</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={handleDelete} disabled={!form}><Trash2 className="h-3 w-3" /></Button>
            {saveStatus === "saved" && <Badge variant="secondary" className="text-[10px] h-5 gap-1 ml-auto"><Check className="h-3 w-3" /> 저장됨</Badge>}
          </div>
          <div ref={costListRef} className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50">
                  <TableHead className="h-7 text-[9px] uppercase tracking-widest px-2">플랫폼</TableHead>
                  <TableHead className="h-7 text-[9px] uppercase tracking-widest px-2 text-right">비용</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costsForCohort.map((c) => {
                  const isSelected = c.id === selectedId;
                  return (
                    <TableRow key={c.id} data-cost-id={c.id} className={`cursor-pointer border-b border-border/30 transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/30"}`} onClick={() => setSelectedId(c.id)}>
                      <TableCell className="py-1.5 px-2 text-[11px]">{c.platform_name || "(미입력)"}</TableCell>
                      <TableCell className="py-1.5 px-2 text-[11px] text-right tabular-nums">{formatWonCompact(c.fee_amount + c.ad_cost_amount)}</TableCell>
                    </TableRow>
                  );
                })}
                {costsForCohort.length === 0 && <TableRow><TableCell colSpan={2} className="text-center py-8 text-xs text-muted-foreground">비용 데이터가 없습니다</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          {costsForCohort.length > 0 && (
            <div className="border-t p-2 text-xs flex justify-between">
              <span className="text-muted-foreground">합계</span>
              <span className="font-medium tabular-nums">{formatWonCompact(costsForCohort.reduce((s, c) => s + c.fee_amount + c.ad_cost_amount, 0))}</span>
            </div>
          )}
        </div>

        {/* Right: cost form */}
        <div className="w-[55%] min-w-0 overflow-y-auto overflow-x-hidden p-3">
          {form ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">플랫폼 이름</Label>
                <Input value={form.platform_name} onChange={(e) => updateField("platform_name", e.target.value)} className="h-8 text-xs w-full" placeholder="예: 네이버, 구글" />
                {recentPlatforms.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {recentPlatforms.slice(0, 5).map((name) => (
                      <Button key={name} variant="outline" size="sm" className="h-5 text-[9px] px-1.5" onClick={() => updateField("platform_name", name)}>
                        {name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">수수료율 (%)</Label>
                <Input
                  type="number" step="0.1" min="0" max="100"
                  value={form.fee_rate_pct ?? ""}
                  onChange={(e) => {
                    const r = Number(e.target.value) || 0;
                    const calcFee = Math.round(cohortRevenue * (r / 100));
                    updateField("fee_rate_pct", r);
                    updateField("fee_amount", calcFee);
                  }}
                  className="tabular-nums h-8 text-xs w-full"
                />
                <p className="text-[10px] text-muted-foreground">
                  수수료 금액 = <span className="font-medium text-foreground tabular-nums">{(form.fee_amount ?? 0).toLocaleString("ko-KR")}원</span>
                  <span className="ml-1">(매출 {formatWonCompact(cohortRevenue)} × {form.fee_rate_pct ?? 0}%)</span>
                </p>
                {cohortRevenue === 0 && <p className="text-[10px] text-amber-600 dark:text-amber-400">⚠ 매출이 0이면 수수료가 0으로 계산됩니다</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">광고비 (원)</Label>
                <Input
                  value={form.ad_cost_amount ? fmtInput(form.ad_cost_amount) : ""}
                  onChange={(e) => { const n = parseNum(e.target.value); if (n >= 0) updateField("ad_cost_amount", n); }}
                  className="tabular-nums h-8 text-xs w-full" inputMode="numeric"
                />
                {form.ad_cost_amount > 0 && <p className="text-[10px] text-muted-foreground">표시: {formatWonCompact(form.ad_cost_amount)}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">메모</Label>
                <Input value={form.note} onChange={(e) => updateField("note", e.target.value)} className="h-8 text-xs w-full" placeholder="(선택)" />
              </div>
              <div className="rounded-md bg-muted p-2.5">
                <p className="text-[10px] text-muted-foreground">
                  💡 비용은 플랫폼별로 입력합니다. 같은 기수의 비용 합계가 대시보드에 표시됩니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center"><p className="text-xs text-muted-foreground">"새 비용" 버튼을 눌러 입력하세요</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
