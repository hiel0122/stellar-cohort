import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Plus, Copy, Trash2, Check, Search } from "lucide-react";
import { toast } from "sonner";
import {
  type RawCohort,
  loadRawCohorts,
  upsertRawCohort,
  deleteRawCohort,
  makeId,
  getNextCohortNo,
} from "@/lib/rawCohortStore";
import { useRawCohortStore } from "@/hooks/useRawCohortStore";
import { formatWonCompact } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current dashboard filter context for auto-fill */
  defaultInstructor?: string;
  defaultCourse?: string;
}

function parseNum(v: string): number {
  return Number(v.replace(/[^0-9.-]/g, "")) || 0;
}

function fmtInput(v: number): string {
  return v.toLocaleString("ko-KR");
}

type StatusFilter = "all" | "active" | "closed" | "planned";

export function RawDataInputDrawer({ open, onOpenChange, defaultInstructor, defaultCourse }: Props) {
  const rawCohorts = useRawCohortStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form state
  const [form, setForm] = useState<RawCohort | null>(null);

  // Select first row if nothing is selected
  useEffect(() => {
    if (open && rawCohorts.length > 0 && !selectedId) {
      setSelectedId(rawCohorts[0].id);
    }
  }, [open, rawCohorts.length]);

  // Load form from selection
  useEffect(() => {
    if (!selectedId) { setForm(null); return; }
    const found = rawCohorts.find((c) => c.id === selectedId);
    if (found) setForm({ ...found });
  }, [selectedId, rawCohorts]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = [...rawCohorts];
    if (statusFilter !== "all") list = list.filter((c) => c.status === statusFilter);
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(
        (c) => c.instructor_name.toLowerCase().includes(q) || c.course_title.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      const cmp = a.instructor_name.localeCompare(b.instructor_name);
      if (cmp !== 0) return cmp;
      const cmp2 = a.course_title.localeCompare(b.course_title);
      if (cmp2 !== 0) return cmp2;
      return a.cohort_no - b.cohort_no;
    });
  }, [rawCohorts, statusFilter, searchText]);

  // Auto-save with debounce
  const autoSave = useCallback((updated: RawCohort) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Re-compute id if key fields changed
      const newId = makeId(updated.instructor_name, updated.course_title, updated.cohort_no);
      if (newId !== updated.id) {
        // Delete old, save with new id
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

  // Validation
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

  // ── Actions ──
  const handleAddNew = () => {
    const instName = defaultInstructor?.replace("inst-", "") ?? rawCohorts[0]?.instructor_name ?? "강사";
    const courseTitle = defaultCourse ? rawCohorts.find((c) => c.course_title.includes(defaultCourse.replace("course-", "")))?.course_title ?? rawCohorts[0]?.course_title ?? "과정" : rawCohorts[0]?.course_title ?? "과정";
    // Better: use actual instructor/course from context
    const actualInst = rawCohorts.find((c) => `inst-${c.instructor_name}` === defaultInstructor)?.instructor_name ?? instName;
    const actualCourse = rawCohorts.find((c) => `course-${c.course_title}` === defaultCourse)?.course_title ?? rawCohorts[0]?.course_title ?? "과정";
    
    const nextNo = getNextCohortNo(actualInst, actualCourse);
    const newCohort: RawCohort = {
      id: makeId(actualInst, actualCourse, nextNo),
      instructor_name: actualInst,
      course_title: actualCourse,
      cohort_no: nextNo,
      status: "active",
      start_date: new Date().toISOString().slice(0, 10),
      revenue: 0,
      leads: 0,
      applied: 0,
      students: 0,
    };
    upsertRawCohort(newCohort);
    setSelectedId(newCohort.id);
    toast.success(`${nextNo}기 추가됨`);
  };

  const handleClonePrev = () => {
    if (!form) return;
    const nextNo = getNextCohortNo(form.instructor_name, form.course_title);
    const cloned: RawCohort = {
      ...form,
      id: makeId(form.instructor_name, form.course_title, nextNo),
      cohort_no: nextNo,
      status: "active",
      revenue: 0, // reset revenue
    };
    upsertRawCohort(cloned);
    setSelectedId(cloned.id);
    toast.success(`${form.cohort_no}기 복제 → ${nextNo}기`);
  };

  const handleDelete = () => {
    if (!form) return;
    const name = `${form.instructor_name} ${form.course_title} ${form.cohort_no}기`;
    deleteRawCohort(form.id);
    setSelectedId(null);
    toast.success(`${name} 삭제됨`);
  };

  // Number input helper
  const numField = (label: string, key: "revenue" | "leads" | "applied" | "students", suffix?: string) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        value={form ? fmtInput(form[key]) : ""}
        onChange={(e) => {
          const n = parseNum(e.target.value);
          if (n >= 0) updateField(key, n);
        }}
        onBlur={() => form && updateField(key, form[key])}
        className="tabular-nums h-8 text-xs"
        inputMode="numeric"
      />
      {suffix && form && (
        <p className="text-[10px] text-muted-foreground">{suffix}: {formatWonCompact(form[key])}</p>
      )}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-hidden p-0 flex flex-col" side="right">
        {/* Header */}
        <SheetHeader className="px-4 pt-4 pb-2 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-sm">원데이터 입력</SheetTitle>
              <SheetDescription className="text-[11px]">
                기수별 원천 데이터를 입력하세요. 대시보드에 즉시 반영됩니다.
              </SheetDescription>
            </div>
            <div className="flex items-center gap-1.5">
              {saveStatus === "saved" && (
                <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                  <Check className="h-3 w-3" /> 저장됨
                </Badge>
              )}
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-1.5 pt-1">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleAddNew}>
              <Plus className="h-3 w-3" /> 새 기수
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleClonePrev} disabled={!form}>
              <Copy className="h-3 w-3" /> 직전 복제
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={handleDelete} disabled={!form}>
              <Trash2 className="h-3 w-3" /> 삭제
            </Button>
          </div>
        </SheetHeader>

        {/* Body: table + form */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: list */}
          <div className="w-[55%] border-r flex flex-col overflow-hidden">
            {/* Search + filter */}
            <div className="flex items-center gap-1.5 p-2 border-b">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="강사/과정 검색"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="h-7 text-xs pl-7"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="h-7 w-20 text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="active">운영중</SelectItem>
                  <SelectItem value="closed">종료</SelectItem>
                  <SelectItem value="planned">계획</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Table */}
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
                      <TableRow
                        key={c.id}
                        className={`cursor-pointer border-b border-border/30 transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/30"}`}
                        onClick={() => setSelectedId(c.id)}
                      >
                        <TableCell className="py-1.5 px-2 text-[11px]">{c.instructor_name}</TableCell>
                        <TableCell className="py-1.5 px-2 text-[11px] max-w-[120px] truncate">{c.course_title}</TableCell>
                        <TableCell className="py-1.5 px-2 text-[11px] text-center">
                          {c.cohort_no}기
                          {hasWarn && <span className="ml-1 text-yellow-500">⚠</span>}
                        </TableCell>
                        <TableCell className="py-1.5 px-2">
                          <Badge
                            variant={c.status === "active" ? "default" : c.status === "closed" ? "secondary" : "outline"}
                            className="text-[9px] h-4 px-1"
                          >
                            {c.status === "active" ? "운영중" : c.status === "closed" ? "종료" : "계획"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1.5 px-2 text-[11px] text-right tabular-nums">{formatWonCompact(c.revenue)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                        데이터가 없습니다
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Right: edit form */}
          <div className="w-[45%] overflow-auto p-3">
            {form ? (
              <div className="space-y-3">
                {/* Errors */}
                {hardErrors.length > 0 && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/5 p-2 space-y-0.5">
                    {hardErrors.map((e, i) => (
                      <p key={i} className="text-[10px] text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" /> {e}
                      </p>
                    ))}
                  </div>
                )}
                {/* Warnings */}
                {warnings.length > 0 && (
                  <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-2 space-y-0.5">
                    {warnings.map((w, i) => (
                      <p key={i} className="text-[10px] text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" /> {w}
                      </p>
                    ))}
                  </div>
                )}

                {/* Fields */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">강사</Label>
                    <Input
                      value={form.instructor_name}
                      onChange={(e) => updateField("instructor_name", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">과정</Label>
                    <Input
                      value={form.course_title}
                      onChange={(e) => updateField("course_title", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">기수</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.cohort_no}
                      onChange={(e) => updateField("cohort_no", parseInt(e.target.value) || 1)}
                      className="h-8 text-xs tabular-nums"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">상태</Label>
                    <Select value={form.status} onValueChange={(v) => updateField("status", v as RawCohort["status"])}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">계획</SelectItem>
                        <SelectItem value="active">운영중</SelectItem>
                        <SelectItem value="closed">종료</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">시작일</Label>
                    <Input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => updateField("start_date", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {numField("매출 (원)", "revenue", "표시")}

                <div className="grid grid-cols-3 gap-2">
                  {numField("리드", "leads")}
                  {numField("지원", "applied")}
                  {numField("수강생", "students")}
                </div>

                {/* Computed */}
                <div className="rounded-md bg-muted p-2.5 space-y-1">
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">자동 계산</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">전환율 (결제/지원)</span>
                    <span className="font-medium tabular-nums">{conversion}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">참고 전환율 (결제/리드)</span>
                    <span className="font-medium tabular-nums">{conversionSec}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-xs text-muted-foreground">좌측 목록에서 기수를 선택하세요</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
