import { useState, useMemo, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AlertTriangle, Target, Plus, Unlock, ArrowLeft, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  type RawCohort, upsertRawCohort, makeId, getNextCohortNo,
} from "@/lib/rawCohortStore";
import { makeTargetKey, upsertTarget, loadAllTargets } from "@/lib/targetStore";
import type { CourseTargets } from "@/lib/types";
import { formatWonFull } from "@/lib/format";
import { findByNormalizedKey, cleanDisplayName } from "@/lib/normalize";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawCohorts: RawCohort[];
  defaultInstructor?: string;
  defaultCourse?: string;
  onCreated: (id: string) => void;
}

type TargetMode = "off" | "copy" | "direct";

export function NewCohortModal({ open, onOpenChange, rawCohorts, defaultInstructor, defaultCourse, onCreated }: Props) {
  // ── Unique values ──
  const instructors = useMemo(() => [...new Set(rawCohorts.map((c) => c.instructor_name))].sort(), [rawCohorts]);

  const resolveInst = () => rawCohorts.find((c) => `inst-${c.instructor_name}` === defaultInstructor)?.instructor_name ?? instructors[0] ?? "";
  const [instructor, setInstructor] = useState(resolveInst);

  // ── Add mode (unlock) ──
  const [addMode, setAddMode] = useState(false);

  // ── New instructor/course input mode ──
  const [isNewInstructor, setIsNewInstructor] = useState(false);
  const [newInstructorInput, setNewInstructorInput] = useState("");
  const [isNewCourse, setIsNewCourse] = useState(false);
  const [newCourseInput, setNewCourseInput] = useState("");

  const coursesForInst = useMemo(
    () => [...new Set(rawCohorts.filter((c) => c.instructor_name === instructor).map((c) => c.course_title))].sort(),
    [rawCohorts, instructor]
  );
  const resolveCourse = () => rawCohorts.find((c) => `course-${c.course_title}` === defaultCourse && c.instructor_name === instructor)?.course_title ?? coursesForInst[0] ?? "";
  const [course, setCourse] = useState(resolveCourse);

  // Effective values (resolving new input vs select)
  const effectiveInstructor = isNewInstructor ? cleanDisplayName(newInstructorInput) : instructor;
  const effectiveCourse = isNewCourse ? cleanDisplayName(newCourseInput) : course;

  const suggestedNo = useMemo(() => getNextCohortNo(effectiveInstructor, effectiveCourse), [rawCohorts, effectiveInstructor, effectiveCourse]);
  const [cohortNo, setCohortNo] = useState(suggestedNo);
  const [status, setStatus] = useState<RawCohort["status"]>("active");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  // ── Target settings ──
  const [targetMode, setTargetMode] = useState<TargetMode>("copy");
  const [copySource, setCopySource] = useState<"prev" | "specific">("prev");
  const [specificCohortNo, setSpecificCohortNo] = useState<number | null>(null);

  const [directRevenue, setDirectRevenue] = useState<string>("");
  const [directStudents, setDirectStudents] = useState<string>("");
  const [directConversion, setDirectConversion] = useState<string>("");

  const cohortsForCourse = useMemo(
    () => rawCohorts.filter((c) => c.instructor_name === effectiveInstructor && c.course_title === effectiveCourse).sort((a, b) => a.cohort_no - b.cohort_no),
    [rawCohorts, effectiveInstructor, effectiveCourse]
  );
  const prevCohort = cohortsForCourse.length > 0 ? cohortsForCourse[cohortsForCourse.length - 1] : null;

  const allTargets = useMemo(() => loadAllTargets(), [open]);

  const getTargetForCohort = (cohortNoVal: number): CourseTargets | null => {
    const key = makeTargetKey(effectiveInstructor, effectiveCourse, cohortNoVal);
    return allTargets[key] ?? null;
  };

  const prevTargets = prevCohort ? getTargetForCohort(prevCohort.cohort_no) : null;
  const specificTargets = specificCohortNo != null ? getTargetForCohort(specificCohortNo) : null;
  const sourceTargets = copySource === "prev" ? prevTargets : specificTargets;

  // ── Reset on open ──
  useEffect(() => {
    if (open) {
      const inst = resolveInst();
      setInstructor(inst);
      setAddMode(false);
      setIsNewInstructor(false);
      setNewInstructorInput("");
      setIsNewCourse(false);
      setNewCourseInput("");
      setStatus("active");
      setStartDate(new Date().toISOString().slice(0, 10));
      setCopySource("prev");
      setSpecificCohortNo(null);
      setDirectRevenue("");
      setDirectStudents("");
      setDirectConversion("");
    }
  }, [open]);

  useEffect(() => {
    if (open && prevCohort) {
      const pt = getTargetForCohort(prevCohort.cohort_no);
      setTargetMode(pt ? "copy" : "direct");
    } else if (open) {
      setTargetMode("direct");
    }
  }, [open, effectiveInstructor, effectiveCourse, prevCohort?.cohort_no]);

  useEffect(() => {
    if (targetMode === "direct" && prevTargets) {
      setDirectRevenue(prevTargets.revenue_target != null ? String(prevTargets.revenue_target) : "");
      setDirectStudents(prevTargets.students_target != null ? String(prevTargets.students_target) : "");
      setDirectConversion(prevTargets.conversion_target != null ? String(prevTargets.conversion_target) : "");
    }
  }, [targetMode]);

  useEffect(() => {
    if (!isNewCourse && !coursesForInst.includes(course)) setCourse(coursesForInst[0] ?? "");
  }, [instructor, coursesForInst]);

  useEffect(() => {
    setCohortNo(suggestedNo);
  }, [suggestedNo]);

  useEffect(() => {
    setSpecificCohortNo(null);
  }, [effectiveInstructor, effectiveCourse]);

  // When switching to new instructor, reset course too
  useEffect(() => {
    if (isNewInstructor) {
      setIsNewCourse(true);
      setNewCourseInput("");
    } else {
      setIsNewCourse(false);
    }
  }, [isNewInstructor]);

  // ── Handle "신규 강사 추가" confirm ──
  const handleConfirmNewInstructor = () => {
    const cleaned = cleanDisplayName(newInstructorInput);
    if (!cleaned) {
      toast.error("강사명을 입력해주세요");
      return;
    }
    const match = findByNormalizedKey(cleaned, instructors);
    if (match) {
      // Auto-select existing
      setInstructor(match);
      setIsNewInstructor(false);
      setNewInstructorInput("");
      toast.info(`기존 강사 "${match}"과(와) 일치하여 자동 선택되었습니다`);
    }
    // Otherwise keep in new mode with the input
  };

  // ── Handle "신규 과정 추가" confirm ──
  const allCourses = useMemo(() => [...new Set(rawCohorts.map((c) => c.course_title))], [rawCohorts]);

  const handleConfirmNewCourse = () => {
    const cleaned = cleanDisplayName(newCourseInput);
    if (!cleaned) {
      toast.error("과정명을 입력해주세요");
      return;
    }
    // Check against courses for current instructor
    const instCourses = isNewInstructor ? allCourses : coursesForInst;
    const match = findByNormalizedKey(cleaned, instCourses);
    if (match) {
      setCourse(match);
      setIsNewCourse(false);
      setNewCourseInput("");
      toast.info(`기존 과정 "${match}"과(와) 일치하여 자동 선택되었습니다`);
    }
  };

  // ── Validation ──
  const duplicateExists = rawCohorts.some(
    (c) => c.instructor_name === effectiveInstructor && c.course_title === effectiveCourse && c.cohort_no === cohortNo
  );
  const canCreate = effectiveInstructor.trim() && effectiveCourse.trim() && cohortNo >= 1 && !duplicateExists;

  const handleCreate = () => {
    if (!canCreate) return;

    // Final duplicate check via normalization
    const finalInstructor = effectiveInstructor;
    const finalCourse = effectiveCourse;

    // If new instructor, check one more time
    if (isNewInstructor) {
      const match = findByNormalizedKey(finalInstructor, instructors);
      if (match) {
        setInstructor(match);
        setIsNewInstructor(false);
        toast.info(`기존 강사 "${match}"과(와) 일치하여 자동 선택되었습니다. 다시 생성을 눌러주세요.`);
        return;
      }
    }
    if (isNewCourse) {
      const instCourses = isNewInstructor ? allCourses : coursesForInst;
      const match = findByNormalizedKey(finalCourse, instCourses);
      if (match) {
        setCourse(match);
        setIsNewCourse(false);
        toast.info(`기존 과정 "${match}"과(와) 일치하여 자동 선택되었습니다. 다시 생성을 눌러주세요.`);
        return;
      }
    }

    const newCohort: RawCohort = {
      id: makeId(finalInstructor, finalCourse, cohortNo),
      instructor_name: finalInstructor,
      course_title: finalCourse,
      cohort_no: cohortNo,
      status,
      start_date: startDate,
      revenue: 0,
      leads: 0,
      applied: 0,
      students: 0,
    };
    upsertRawCohort(newCohort);

    // Save targets
    const newKey = makeTargetKey(finalInstructor, finalCourse, cohortNo);

    if (targetMode === "copy" && sourceTargets) {
      upsertTarget(newKey, { ...sourceTargets });
      toast.success(`${cohortNo}기가 생성되었습니다`);
      toast.success("목표가 복사되었습니다");
    } else if (targetMode === "copy" && !sourceTargets) {
      toast.success(`${cohortNo}기가 생성되었습니다`);
      toast.info("복사할 목표가 없어 목표 없이 생성되었습니다");
    } else if (targetMode === "direct") {
      const rev = directRevenue ? Number(directRevenue) : null;
      const stu = directStudents ? Number(directStudents) : null;
      const conv = directConversion ? Number(directConversion) : null;
      if (rev != null || stu != null || conv != null) {
        upsertTarget(newKey, {
          revenue_target: rev,
          students_target: stu,
          conversion_target: conv != null ? Math.min(Math.max(conv, 0), 100) : null,
        });
        toast.success(`${cohortNo}기가 생성되었습니다`);
        toast.success("목표가 저장되었습니다");
      } else {
        toast.success(`${cohortNo}기가 목표 없이 생성되었습니다`);
      }
    } else {
      toast.success(`${cohortNo}기가 목표 없이 생성되었습니다`);
    }

    if (isNewInstructor || isNewCourse) {
      toast.info("신규 강사/과정이 목록에 추가되었습니다");
    }

    onCreated(newCohort.id);
    onOpenChange(false);
  };

  const directPreview = useMemo(() => {
    const rev = directRevenue ? Number(directRevenue) : null;
    const stu = directStudents ? Number(directStudents) : null;
    const conv = directConversion ? Number(directConversion) : null;
    return { rev, stu, conv };
  }, [directRevenue, directStudents, directConversion]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">새 기수 생성</DialogTitle>
          <DialogDescription className="text-xs">기수 정보를 입력하고 목표를 설정하세요.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* ── Target selection ── */}
          <div className="space-y-2">
            <p className="text-xs font-medium">대상</p>
            {addMode && (
              <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2">
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">추가 모드: 신규 강사/과정을 입력할 수 있습니다</p>
                <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">중복 이름은 자동으로 기존 항목과 매칭됩니다</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {/* Instructor field */}
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">강사</Label>
                {addMode && isNewInstructor ? (
                  <div className="space-y-1.5">
                    <Input
                      value={newInstructorInput}
                      onChange={(e) => setNewInstructorInput(e.target.value)}
                      onBlur={handleConfirmNewInstructor}
                      className="h-8 text-xs w-full border-emerald-500/50 focus-visible:ring-emerald-500/30"
                      placeholder="강사명 입력"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2.5"
                      onClick={() => { setIsNewInstructor(false); setNewInstructorInput(""); }}
                    >
                      <ArrowLeft className="h-3 w-3 mr-1" />목록에서 선택
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
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
                    {addMode && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/30"
                        onClick={() => setIsNewInstructor(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> 신규 강사
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Course field */}
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">과정</Label>
                {addMode && isNewCourse ? (
                  <div className="space-y-1.5">
                    <Input
                      value={newCourseInput}
                      onChange={(e) => setNewCourseInput(e.target.value)}
                      onBlur={handleConfirmNewCourse}
                      className="h-8 text-xs w-full border-emerald-500/50 focus-visible:ring-emerald-500/30"
                      placeholder="과정명 입력"
                    />
                    {!isNewInstructor && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2.5"
                        onClick={() => { setIsNewCourse(false); setNewCourseInput(""); }}
                      >
                        <ArrowLeft className="h-3 w-3 mr-1" />목록에서 선택
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
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
                    {addMode && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/30"
                        onClick={() => setIsNewCourse(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> 신규 과정
                      </Button>
                    )}
                  </div>
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
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-xs w-full min-w-0" />
              </div>
            </div>
            {duplicateExists && (
              <div className="flex items-center gap-1.5 text-destructive">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <p className="text-[10px]">이미 존재하는 기수입니다. 다른 기수 번호를 입력하세요.</p>
              </div>
            )}
          </div>

          {/* ── Target settings ── */}
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-medium flex items-center gap-1.5">
              <Target className="h-3 w-3" /> 목표 설정 <span className="text-muted-foreground font-normal">(선택)</span>
            </p>

            <RadioGroup value={targetMode} onValueChange={(v) => setTargetMode(v as TargetMode)} className="gap-1.5">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="off" id="target-off" />
                <Label htmlFor="target-off" className="text-xs cursor-pointer">목표 없음</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="copy" id="target-copy" disabled={cohortsForCourse.length === 0} />
                <Label htmlFor="target-copy" className="text-xs cursor-pointer">
                  목표 복사
                  {cohortsForCourse.length === 0 && <span className="text-muted-foreground ml-1">(기수 없음)</span>}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="direct" id="target-direct" />
                <Label htmlFor="target-direct" className="text-xs cursor-pointer">목표 직접 입력</Label>
              </div>
            </RadioGroup>

            {/* Copy mode */}
            {targetMode === "copy" && cohortsForCourse.length > 0 && (
              <div className="space-y-2 pl-5">
                <RadioGroup value={copySource} onValueChange={(v) => setCopySource(v as "prev" | "specific")} className="gap-1.5">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="prev" id="copy-prev" />
                    <Label htmlFor="copy-prev" className="text-[11px] cursor-pointer">
                      직전 기수 ({prevCohort ? `${prevCohort.cohort_no}기` : "없음"})
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="specific" id="copy-specific" />
                    <Label htmlFor="copy-specific" className="text-[11px] cursor-pointer">특정 기수 선택</Label>
                  </div>
                </RadioGroup>

                {copySource === "specific" && (
                  <Select value={specificCohortNo != null ? String(specificCohortNo) : ""} onValueChange={(v) => setSpecificCohortNo(Number(v))}>
                    <SelectTrigger className="h-7 text-xs w-full"><SelectValue placeholder="기수 선택" /></SelectTrigger>
                    <SelectContent>
                      {cohortsForCourse.map((c) => (
                        <SelectItem key={c.cohort_no} value={String(c.cohort_no)}>{c.cohort_no}기</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <TargetPreview targets={sourceTargets} label={copySource === "prev" ? `${prevCohort?.cohort_no ?? "?"}기 목표` : specificCohortNo != null ? `${specificCohortNo}기 목표` : null} />
              </div>
            )}

            {/* Direct input mode */}
            {targetMode === "direct" && (
              <div className="space-y-2 pl-5">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">목표 매출</Label>
                    <Input
                      type="number"
                      min={0}
                      value={directRevenue}
                      onChange={(e) => setDirectRevenue(e.target.value)}
                      className="h-7 text-xs w-full min-w-0 tabular-nums"
                      placeholder="300000000"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">목표 수강생</Label>
                    <Input
                      type="number"
                      min={0}
                      value={directStudents}
                      onChange={(e) => setDirectStudents(e.target.value)}
                      className="h-7 text-xs w-full min-w-0 tabular-nums"
                      placeholder="50"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">목표 전환율(%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={directConversion}
                      onChange={(e) => setDirectConversion(e.target.value)}
                      className="h-7 text-xs w-full min-w-0 tabular-nums"
                      placeholder="15"
                    />
                  </div>
                </div>
                {(directPreview.rev != null || directPreview.stu != null || directPreview.conv != null) && (
                  <div className="rounded-md bg-muted p-2">
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">미리보기</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
                      {directPreview.rev != null && <span>매출 <strong className="tabular-nums">{formatWonFull(directPreview.rev)}</strong></span>}
                      {directPreview.stu != null && <span>수강생 <strong className="tabular-nums">{directPreview.stu}명</strong></span>}
                      {directPreview.conv != null && <span>전환율 <strong className="tabular-nums">{directPreview.conv}%</strong></span>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          <Button
            type="button"
            size="sm"
            className={`text-xs gap-1.5 ${addMode
              ? "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
              : "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
            }`}
            onClick={() => {
              if (addMode) {
                // Turn off: reset new inputs
                setAddMode(false);
                setIsNewInstructor(false);
                setNewInstructorInput("");
                setIsNewCourse(false);
                setNewCourseInput("");
              } else {
                setAddMode(true);
              }
            }}
          >
            {addMode ? <Unlock className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {addMode ? "추가 모드 해제" : "강사/과정 추가"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>취소</Button>
            <Button size="sm" className="text-xs" onClick={handleCreate} disabled={!canCreate}>생성</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Target preview sub-component ──
function TargetPreview({ targets, label }: { targets: CourseTargets | null; label: string | null }) {
  if (!label) return <p className="text-[10px] text-muted-foreground">복사할 기수를 선택하세요.</p>;
  if (!targets) return (
    <div className="rounded-md bg-muted p-2">
      <p className="text-[10px] text-muted-foreground">{label}: 목표가 설정되어 있지 않습니다. 생성 시 목표 복사는 건너뜁니다.</p>
    </div>
  );
  return (
    <div className="rounded-md bg-muted p-2">
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{label} →</p>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
        {targets.revenue_target != null && <span>매출 <strong className="tabular-nums">{formatWonFull(targets.revenue_target)}</strong></span>}
        {targets.students_target != null && <span>수강생 <strong className="tabular-nums">{targets.students_target}명</strong></span>}
        {targets.conversion_target != null && <span>전환율 <strong className="tabular-nums">{targets.conversion_target}%</strong></span>}
        {targets.revenue_target == null && targets.students_target == null && targets.conversion_target == null && (
          <span className="text-muted-foreground">모든 목표 미설정</span>
        )}
      </div>
    </div>
  );
}
