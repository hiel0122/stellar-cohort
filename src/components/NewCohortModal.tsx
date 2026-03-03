import { useState, useMemo, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  type RawCohort, upsertRawCohort, makeId, getNextCohortNo,
} from "@/lib/rawCohortStore";
import { formatWonCompact } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawCohorts: RawCohort[];
  defaultInstructor?: string;
  defaultCourse?: string;
  onCreated: (id: string) => void;
}

export function NewCohortModal({ open, onOpenChange, rawCohorts, defaultInstructor, defaultCourse, onCreated }: Props) {
  // ── Unique values ──
  const instructors = useMemo(() => [...new Set(rawCohorts.map((c) => c.instructor_name))].sort(), [rawCohorts]);
  
  const resolveInst = () => rawCohorts.find((c) => `inst-${c.instructor_name}` === defaultInstructor)?.instructor_name ?? instructors[0] ?? "";
  const [instructor, setInstructor] = useState(resolveInst);

  const coursesForInst = useMemo(
    () => [...new Set(rawCohorts.filter((c) => c.instructor_name === instructor).map((c) => c.course_title))].sort(),
    [rawCohorts, instructor]
  );
  const resolveCourse = () => rawCohorts.find((c) => `course-${c.course_title}` === defaultCourse && c.instructor_name === instructor)?.course_title ?? coursesForInst[0] ?? "";
  const [course, setCourse] = useState(resolveCourse);

  const suggestedNo = useMemo(() => getNextCohortNo(instructor, course), [rawCohorts, instructor, course]);
  const [cohortNo, setCohortNo] = useState(suggestedNo);
  const [status, setStatus] = useState<RawCohort["status"]>("active");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  // ── Copy options ──
  const [copyEnabled, setCopyEnabled] = useState(true);
  const [copySource, setCopySource] = useState<"prev" | "specific">("prev");
  const [specificCohortNo, setSpecificCohortNo] = useState<number | null>(null);

  const cohortsForCourse = useMemo(
    () => rawCohorts.filter((c) => c.instructor_name === instructor && c.course_title === course).sort((a, b) => a.cohort_no - b.cohort_no),
    [rawCohorts, instructor, course]
  );
  const prevCohort = cohortsForCourse.length > 0 ? cohortsForCourse[cohortsForCourse.length - 1] : null;
  const specificCohort = specificCohortNo != null ? cohortsForCourse.find((c) => c.cohort_no === specificCohortNo) ?? null : null;
  const sourceCohort = copyEnabled ? (copySource === "prev" ? prevCohort : specificCohort) : null;

  // ── Reset on open / instructor/course change ──
  useEffect(() => {
    if (open) {
      const inst = resolveInst();
      setInstructor(inst);
      setStatus("active");
      setStartDate(new Date().toISOString().slice(0, 10));
      setCopyEnabled(true);
      setCopySource("prev");
      setSpecificCohortNo(null);
    }
  }, [open]);

  useEffect(() => {
    if (!coursesForInst.includes(course)) setCourse(coursesForInst[0] ?? "");
  }, [instructor, coursesForInst]);

  useEffect(() => {
    setCohortNo(suggestedNo);
  }, [suggestedNo]);

  useEffect(() => {
    setSpecificCohortNo(null);
  }, [instructor, course]);

  // ── Validation ──
  const duplicateExists = rawCohorts.some(
    (c) => c.instructor_name === instructor && c.course_title === course && c.cohort_no === cohortNo
  );
  const canCreate = instructor.trim() && course.trim() && cohortNo >= 1 && !duplicateExists;

  const handleCreate = () => {
    if (!canCreate) return;
    const newCohort: RawCohort = {
      id: makeId(instructor.trim(), course.trim(), cohortNo),
      instructor_name: instructor.trim(),
      course_title: course.trim(),
      cohort_no: cohortNo,
      status,
      start_date: startDate,
      revenue: 0,
      leads: sourceCohort?.leads ?? 0,
      applied: sourceCohort?.applied ?? 0,
      students: sourceCohort?.students ?? 0,
    };
    upsertRawCohort(newCohort);
    toast.success(`${cohortNo}기가 생성되었습니다`);
    onCreated(newCohort.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">새 기수 생성</DialogTitle>
          <DialogDescription className="text-xs">기수 정보를 입력하고 데이터 복사 옵션을 선택하세요.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* ── Target selection ── */}
          <div className="space-y-2">
            <p className="text-xs font-medium">대상</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">강사</Label>
                {instructors.length > 0 ? (
                  <Select value={instructor} onValueChange={setInstructor}>
                    <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {instructors.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={instructor} onChange={(e) => setInstructor(e.target.value)} className="h-8 text-xs w-full" placeholder="강사명" />
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">과정</Label>
                {coursesForInst.length > 0 ? (
                  <Select value={course} onValueChange={setCourse}>
                    <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {coursesForInst.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={course} onChange={(e) => setCourse(e.target.value)} className="h-8 text-xs w-full" placeholder="과정명" />
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">기수</Label>
                <Input type="number" min={1} value={cohortNo} onChange={(e) => setCohortNo(parseInt(e.target.value) || 1)} className="h-8 text-xs tabular-nums w-full" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">상태</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as RawCohort["status"])}>
                  <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">운영중</SelectItem>
                    <SelectItem value="planned">계획</SelectItem>
                    <SelectItem value="closed">종료</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">시작일</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-xs w-full" />
              </div>
            </div>
            {duplicateExists && (
              <div className="flex items-center gap-1.5 text-destructive">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <p className="text-[10px]">이미 존재하는 기수입니다. 다른 기수 번호를 입력하세요.</p>
              </div>
            )}
          </div>

          {/* ── Copy options ── */}
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium flex items-center gap-1.5"><Copy className="h-3 w-3" /> 데이터 복사</p>
              <Switch checked={copyEnabled} onCheckedChange={setCopyEnabled} disabled={cohortsForCourse.length === 0} />
            </div>

            {cohortsForCourse.length === 0 && (
              <p className="text-[10px] text-muted-foreground">같은 강사+과정의 기수가 없어 복사할 수 없습니다.</p>
            )}

            {copyEnabled && cohortsForCourse.length > 0 && (
              <div className="space-y-2">
                <RadioGroup value={copySource} onValueChange={(v) => setCopySource(v as "prev" | "specific")} className="gap-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="prev" id="copy-prev" />
                    <Label htmlFor="copy-prev" className="text-xs cursor-pointer">
                      직전 기수 ({prevCohort ? `${prevCohort.cohort_no}기` : "없음"})
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="specific" id="copy-specific" />
                    <Label htmlFor="copy-specific" className="text-xs cursor-pointer">특정 기수 선택</Label>
                  </div>
                </RadioGroup>

                {copySource === "specific" && (
                  <Select value={specificCohortNo != null ? String(specificCohortNo) : ""} onValueChange={(v) => setSpecificCohortNo(Number(v))}>
                    <SelectTrigger className="h-8 text-xs w-full"><SelectValue placeholder="기수 선택" /></SelectTrigger>
                    <SelectContent>
                      {cohortsForCourse.map((c) => (
                        <SelectItem key={c.cohort_no} value={String(c.cohort_no)}>{c.cohort_no}기</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {sourceCohort && (
                  <div className="rounded-md bg-muted p-2 space-y-0.5">
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">복사 미리보기 ({sourceCohort.cohort_no}기 →)</p>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div><span className="text-muted-foreground">리드</span> <span className="font-medium tabular-nums">{sourceCohort.leads.toLocaleString()}</span></div>
                      <div><span className="text-muted-foreground">지원</span> <span className="font-medium tabular-nums">{sourceCohort.applied.toLocaleString()}</span></div>
                      <div><span className="text-muted-foreground">수강생</span> <span className="font-medium tabular-nums">{sourceCohort.students.toLocaleString()}</span></div>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1">매출은 항상 0으로 초기화됩니다.</p>
                  </div>
                )}
                {copySource === "specific" && !specificCohort && (
                  <p className="text-[10px] text-muted-foreground">복사할 기수를 선택하세요.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>취소</Button>
          <Button size="sm" className="text-xs" onClick={handleCreate} disabled={!canCreate}>생성</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
