import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GitCompareArrows, AlertCircle } from "lucide-react";
import type { CompareMode } from "@/hooks/useDashboardData";
import type { Cohort, Instructor, Course } from "@/lib/types";

interface Props {
  mode: CompareMode;
  onModeChange: (mode: CompareMode) => void;
  baselineCohortId: string;
  onBaselineChange: (id: string) => void;
  cohorts: Cohort[];
  currentCohortId: string;
  baselineCohortNo: number | null;
  // Cross-instructor props
  instructors: Instructor[];
  crossInstructorId: string;
  onCrossInstructorChange: (id: string) => void;
  crossCourses: Course[];
  crossCourseId: string;
  onCrossCourseChange: (id: string) => void;
  crossCohorts: Cohort[];
  crossCohortId: string;
  onCrossCohortChange: (id: string) => void;
  crossBaselineLabel: string | null;
  isSameCohort: boolean;
}

const modeLabels: Record<CompareMode, string> = {
  off: "비교 OFF",
  prev: "전기수 비교",
  select: "기수 선택 비교",
  cross: "다른 강사/강의 비교",
};

export function CompareToggle({
  mode, onModeChange,
  baselineCohortId, onBaselineChange,
  cohorts, currentCohortId,
  baselineCohortNo,
  instructors,
  crossInstructorId, onCrossInstructorChange,
  crossCourses, crossCourseId, onCrossCourseChange,
  crossCohorts, crossCohortId, onCrossCohortChange,
  crossBaselineLabel, isSameCohort,
}: Props) {
  const selectableCohorts = cohorts.filter((c) => c.id !== currentCohortId);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <GitCompareArrows className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <Select value={mode} onValueChange={(v) => onModeChange(v as CompareMode)}>
        <SelectTrigger className="h-8 w-[170px] text-xs bg-card border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(modeLabels) as CompareMode[]).map((m) => (
            <SelectItem key={m} value={m} className="text-xs">
              {modeLabels[m]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Same-instructor cohort select */}
      {mode === "select" && (
        <Select value={baselineCohortId} onValueChange={onBaselineChange} disabled={selectableCohorts.length === 0}>
          <SelectTrigger className="h-8 w-[100px] text-xs bg-card border-border">
            <SelectValue placeholder="기준 기수" />
          </SelectTrigger>
          <SelectContent>
            {selectableCohorts.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-xs">
                {c.cohort_no}기
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Cross-instructor selectors */}
      {mode === "cross" && (
        <>
          <div className="h-4 w-px bg-border mx-0.5" />
          <Select value={crossInstructorId} onValueChange={onCrossInstructorChange}>
            <SelectTrigger className="h-8 w-[120px] text-xs bg-card border-border">
              <SelectValue placeholder="강사" />
            </SelectTrigger>
            <SelectContent>
              {instructors.map((inst) => (
                <SelectItem key={inst.id} value={inst.id} className="text-xs">
                  {inst.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={crossCourseId} onValueChange={onCrossCourseChange} disabled={crossCourses.length === 0}>
            <SelectTrigger className="h-8 w-[130px] text-xs bg-card border-border">
              <SelectValue placeholder="강의" />
            </SelectTrigger>
            <SelectContent>
              {crossCourses.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={crossCohortId} onValueChange={onCrossCohortChange} disabled={crossCohorts.length === 0}>
            <SelectTrigger className="h-8 w-[90px] text-xs bg-card border-border">
              <SelectValue placeholder="기수" />
            </SelectTrigger>
            <SelectContent>
              {crossCohorts.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.cohort_no}기
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      {/* Label */}
      {mode !== "off" && (
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {mode === "cross" && crossBaselineLabel
            ? `vs ${crossBaselineLabel}`
            : baselineCohortNo
            ? `기준: ${baselineCohortNo}기`
            : "기준 없음"}
        </span>
      )}

      {/* Same cohort warning */}
      {isSameCohort && (
        <span className="flex items-center gap-1 text-[10px] text-destructive">
          <AlertCircle className="h-3 w-3" />
          같은 기수입니다
        </span>
      )}
    </div>
  );
}
