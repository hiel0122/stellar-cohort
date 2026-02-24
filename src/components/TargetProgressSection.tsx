import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target } from "lucide-react";
import type { CourseTargets } from "@/lib/types";
import { formatWonCompact, formatWonFull, formatInt } from "@/lib/format";
import { calcProgress, calcRemaining, calcDeltaPp } from "@/hooks/useTargets";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  targets: CourseTargets | null;
  revenue: number;
  students: number;
  conversion: number; // current conversion %
  onOpenSettings: () => void;
}

function statusBadge(progress: number | null) {
  if (progress == null) return null;
  const pct = progress * 100;
  if (pct >= 90) return { label: "순조", className: "bg-kpi-positive-bg text-kpi-positive" };
  if (pct >= 70) return { label: "주의", className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" };
  return { label: "위험", className: "bg-kpi-negative-bg text-kpi-negative" };
}

export function TargetProgressSection({ targets, revenue, students, conversion, onOpenSettings }: Props) {
  if (!targets) {
    return (
      <Card>
        <CardContent className="py-8 flex flex-col items-center gap-3">
          <Target className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">목표를 설정하면 달성률이 표시됩니다</p>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onOpenSettings}>
            목표 설정
          </Button>
        </CardContent>
      </Card>
    );
  }

  const items = [
    {
      label: "매출",
      current: revenue,
      target: targets.revenue_target,
      formatCurrent: formatWonCompact(revenue),
      formatTarget: targets.revenue_target != null ? formatWonCompact(targets.revenue_target) : "—",
      formatRemaining: targets.revenue_target != null ? formatWonCompact(calcRemaining(targets.revenue_target, revenue) ?? 0) : "—",
      tooltipCurrent: formatWonFull(revenue),
      tooltipTarget: targets.revenue_target != null ? formatWonFull(targets.revenue_target) : "미설정",
      progress: calcProgress(revenue, targets.revenue_target),
      isPct: false,
    },
    {
      label: "수강생",
      current: students,
      target: targets.students_target,
      formatCurrent: `${formatInt(students)}명`,
      formatTarget: targets.students_target != null ? `${formatInt(targets.students_target)}명` : "—",
      formatRemaining: targets.students_target != null ? `${formatInt(calcRemaining(targets.students_target, students) ?? 0)}명` : "—",
      tooltipCurrent: `${formatInt(students)}명`,
      tooltipTarget: targets.students_target != null ? `${formatInt(targets.students_target)}명` : "미설정",
      progress: calcProgress(students, targets.students_target),
      isPct: false,
    },
    {
      label: "전환율",
      current: conversion,
      target: targets.conversion_target,
      formatCurrent: `${conversion.toFixed(1)}%`,
      formatTarget: targets.conversion_target != null ? `${targets.conversion_target.toFixed(1)}%` : "—",
      formatRemaining: null,
      tooltipCurrent: `${conversion.toFixed(1)}%`,
      tooltipTarget: targets.conversion_target != null ? `${targets.conversion_target.toFixed(1)}%` : "미설정",
      progress: calcProgress(conversion, targets.conversion_target),
      isPct: true,
      deltaPp: calcDeltaPp(conversion, targets.conversion_target),
    },
  ];

  return (
    <Card>
      <CardContent className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-sm font-semibold">목표 대비</p>
            <span className="text-[10px] text-muted-foreground">현재 기수 기준</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] text-muted-foreground" onClick={onOpenSettings}>
            수정
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {items.map((item) => {
            const badge = statusBadge(item.progress);
            const pctText = item.progress != null ? `${(item.progress * 100).toFixed(1)}%` : "—";
            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{item.label}</span>
                  {badge && (
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${badge.className}`}>
                      {badge.label}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${(item.progress ?? 0) * 100}%` }}
                  />
                </div>

                {/* Values */}
                <div className="flex items-baseline justify-between">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm font-semibold tabular-nums text-foreground cursor-default">
                        {item.formatCurrent}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs tabular-nums">{item.tooltipCurrent}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[10px] tabular-nums text-muted-foreground cursor-default">
                        / {item.formatTarget}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs tabular-nums">목표: {item.tooltipTarget}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>달성률 {pctText}</span>
                  {item.isPct && item.deltaPp != null ? (
                    <span className={item.deltaPp >= 0 ? "text-kpi-positive" : "text-kpi-negative"}>
                      {item.deltaPp >= 0 ? "+" : ""}{item.deltaPp.toFixed(1)}pp
                    </span>
                  ) : item.formatRemaining != null ? (
                    <span>남은: {item.formatRemaining}</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
