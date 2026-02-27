import { useState, useEffect, useMemo } from "react";
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
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Cohort } from "@/lib/types";
import {
  commitOverride,
  revertOverride,
  getOverride,
  type CohortOverride,
} from "@/lib/cohortOverrides";
import { formatWonCompact } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohort: Cohort | null;
  onSaved: () => void;
}

function parseNum(v: string): number {
  return Number(v.replace(/,/g, "")) || 0;
}

function fmtInput(v: number): string {
  return v.toLocaleString("ko-KR");
}

export function CohortQuickEditSheet({ open, onOpenChange, cohort, onSaved }: Props) {
  const [revenue, setRevenue] = useState("");
  const [students, setStudents] = useState("");
  const [leads, setLeads] = useState("");
  const [applied, setApplied] = useState("");
  const [status, setStatus] = useState<"planned" | "active" | "closed">("active");
  const [startDate, setStartDate] = useState("");

  // Reset form when cohort changes
  useEffect(() => {
    if (!cohort) return;
    setRevenue(fmtInput(cohort.revenue));
    setStudents(fmtInput(cohort.students));
    setLeads(fmtInput(cohort.leads));
    setApplied(fmtInput(cohort.applied));
    setStatus(cohort.status);
    setStartDate(cohort.start_date ?? "");
  }, [cohort, open]);

  const parsed = useMemo(() => ({
    revenue: parseNum(revenue),
    students: parseNum(students),
    leads: parseNum(leads),
    applied: parseNum(applied),
  }), [revenue, students, leads, applied]);

  // Validation
  const hardErrors = useMemo(() => {
    const errs: string[] = [];
    if (parsed.revenue < 0) errs.push("매출은 0 이상이어야 합니다.");
    if (parsed.students < 0) errs.push("수강생은 0 이상이어야 합니다.");
    if (parsed.leads < 0) errs.push("리드는 0 이상이어야 합니다.");
    if (parsed.applied < 0) errs.push("지원 수는 0 이상이어야 합니다.");
    return errs;
  }, [parsed]);

  const warnings = useMemo(() => {
    const ws: string[] = [];
    if (parsed.applied > parsed.leads && parsed.leads > 0) ws.push("지원 수가 리드보다 큽니다. 데이터 확인 필요");
    if (parsed.students > parsed.applied && parsed.applied > 0) ws.push("결제 수가 지원 수보다 큽니다. 데이터 확인 필요");
    return ws;
  }, [parsed]);

  const conversion = parsed.applied > 0 ? ((parsed.students / parsed.applied) * 100).toFixed(1) : "—";
  const conversionSec = parsed.leads > 0 ? ((parsed.students / parsed.leads) * 100).toFixed(1) : "—";

  const canSave = hardErrors.length === 0;

  const handleSave = () => {
    if (!cohort || !canSave) return;

    // Snapshot previous overrides for undo
    const prevOverride = getOverride(cohort.id);
    const snapshotForUndo: CohortOverride | undefined = prevOverride
      ? { ...prevOverride }
      : undefined;

    const newOverride: CohortOverride = {
      revenue: parsed.revenue,
      students: parsed.students,
      leads: parsed.leads,
      applied: parsed.applied,
      status,
      start_date: startDate || undefined,
    };

    commitOverride(cohort.id, newOverride);
    onSaved();
    onOpenChange(false);

    toast.success(`${cohort.cohort_no}기 수정 완료`, {
      description: `매출: ${formatWonCompact(parsed.revenue)}`,
      action: {
        label: "되돌리기",
        onClick: () => {
          revertOverride(cohort.id, snapshotForUndo);
          onSaved();
          toast.info("이전 값으로 복원했습니다");
        },
      },
    });
  };

  if (!cohort) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base">{cohort.cohort_no}기 빠른 수정</SheetTitle>
          <SheetDescription className="text-xs">
            수치를 수정하면 대시보드 전체에 즉시 반영됩니다
          </SheetDescription>
        </SheetHeader>

        {/* Errors */}
        {hardErrors.length > 0 && (
          <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/5 p-3 space-y-1">
            {hardErrors.map((e, i) => (
              <p key={i} className="text-xs text-destructive flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {e}
              </p>
            ))}
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-1">
            {warnings.map((w, i) => (
              <p key={i} className="text-xs text-yellow-700 dark:text-yellow-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {w}
              </p>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {/* Revenue */}
          <div className="space-y-1.5">
            <Label className="text-xs">매출 (원)</Label>
            <Input
              value={revenue}
              onChange={(e) => setRevenue(e.target.value.replace(/[^0-9,]/g, ""))}
              onBlur={() => setRevenue(fmtInput(parsed.revenue))}
              className="tabular-nums"
              inputMode="numeric"
            />
            <p className="text-[10px] text-muted-foreground">표시: {formatWonCompact(parsed.revenue)}</p>
          </div>

          {/* Students */}
          <div className="space-y-1.5">
            <Label className="text-xs">수강생 (결제)</Label>
            <Input
              value={students}
              onChange={(e) => setStudents(e.target.value.replace(/[^0-9,]/g, ""))}
              onBlur={() => setStudents(fmtInput(parsed.students))}
              className="tabular-nums"
              inputMode="numeric"
            />
          </div>

          {/* Leads */}
          <div className="space-y-1.5">
            <Label className="text-xs">리드</Label>
            <Input
              value={leads}
              onChange={(e) => setLeads(e.target.value.replace(/[^0-9,]/g, ""))}
              onBlur={() => setLeads(fmtInput(parsed.leads))}
              className="tabular-nums"
              inputMode="numeric"
            />
          </div>

          {/* Applied */}
          <div className="space-y-1.5">
            <Label className="text-xs">지원</Label>
            <Input
              value={applied}
              onChange={(e) => setApplied(e.target.value.replace(/[^0-9,]/g, ""))}
              onBlur={() => setApplied(fmtInput(parsed.applied))}
              className="tabular-nums"
              inputMode="numeric"
            />
            {parsed.students > parsed.applied && parsed.applied > 0 && (
              <p className="text-[10px] text-yellow-600 dark:text-yellow-400">⚠ 결제 수 &gt; 지원 수</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-xs">상태</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">계획</SelectItem>
                <SelectItem value="active">운영중</SelectItem>
                <SelectItem value="closed">종료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <Label className="text-xs">시작일</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Computed (read-only) */}
          <div className="rounded-md bg-muted p-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">자동 계산</p>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">전환율 (결제/지원)</span>
              <span className="font-medium tabular-nums">{conversion}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">참고 전환율 (결제/리드)</span>
              <span className="font-medium tabular-nums">{conversionSec}%</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={!canSave}
              className="flex-1"
              size="sm"
            >
              저장
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              size="sm"
            >
              취소
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
