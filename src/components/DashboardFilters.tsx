import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import type { Instructor, Cohort } from "@/lib/types";
import type { CompareMode } from "@/hooks/useDashboardData";
import { CompareToggle } from "./CompareToggle";

interface Props {
  instructorId: string;
  instructors: Instructor[];
  onInstructorChange: (v: string) => void;
  onReset: () => void;
  // Compare
  compareMode: CompareMode;
  onCompareModeChange: (mode: CompareMode) => void;
  baselineCohortId: string;
  onBaselineChange: (id: string) => void;
  cohorts: Cohort[];
  cohortId: string;
  baselineCohortNo: number | null;
}

export function DashboardFilters({
  instructorId,
  instructors = [],
  onInstructorChange, onReset,
  compareMode, onCompareModeChange, baselineCohortId, onBaselineChange,
  cohorts, cohortId, baselineCohortNo,
}: Props) {
  return (
    <div className="sticky top-12 z-20 -mx-4 md:-mx-8 border-b bg-background/80 backdrop-blur-sm px-4 md:px-8 py-3">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
        <Select value={instructorId} onValueChange={onInstructorChange}>
          <SelectTrigger className="h-8 w-[150px] text-xs bg-card border-border">
            <SelectValue placeholder="강사 선택" />
          </SelectTrigger>
          <SelectContent>
            {instructors.map((inst) => (
              <SelectItem key={inst.id} value={inst.id} className="text-xs">
                {inst.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="h-4 w-px bg-border mx-1" />

        <CompareToggle
          mode={compareMode}
          onModeChange={onCompareModeChange}
          baselineCohortId={baselineCohortId}
          onBaselineChange={onBaselineChange}
          cohorts={cohorts}
          currentCohortId={cohortId}
          baselineCohortNo={baselineCohortNo}
        />

        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground ml-auto"
          onClick={onReset}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>
    </div>
  );
}
