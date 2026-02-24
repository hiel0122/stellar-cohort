import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GitCompareArrows } from "lucide-react";
import type { CompareMode } from "@/hooks/useDashboardData";
import type { Cohort } from "@/lib/types";

interface Props {
  mode: CompareMode;
  onModeChange: (mode: CompareMode) => void;
  baselineCohortId: string;
  onBaselineChange: (id: string) => void;
  cohorts: Cohort[];
  currentCohortId: string;
  baselineCohortNo: number | null;
}

const modeLabels: Record<CompareMode, string> = {
  off: "비교 OFF",
  prev: "전기수 비교",
  select: "기수 선택 비교",
};

export function CompareToggle({
  mode, onModeChange,
  baselineCohortId, onBaselineChange,
  cohorts, currentCohortId,
  baselineCohortNo,
}: Props) {
  const selectableCohorts = cohorts.filter((c) => c.id !== currentCohortId);

  return (
    <div className="flex items-center gap-2">
      <GitCompareArrows className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <Select value={mode} onValueChange={(v) => onModeChange(v as CompareMode)}>
        <SelectTrigger className="h-8 w-[140px] text-xs bg-card border-border">
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

      {mode !== "off" && (
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {baselineCohortNo
            ? `기준: ${baselineCohortNo}기`
            : "기준 없음"}
        </span>
      )}
    </div>
  );
}
