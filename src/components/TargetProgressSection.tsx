import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Bug } from "lucide-react";
import type { CourseTargets } from "@/lib/types";
import { formatWonFull, formatInt } from "@/lib/format";
import { calcProgress, calcRemaining, calcDeltaPp } from "@/hooks/useTargets";
import { makeTargetKey, loadAllTargets } from "@/lib/targetStore";
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
  debugInfo?: { instructorName: string; courseName: string; cohortNo: number | null };
}

// ── Achievement level utilities ──
type OverLevel = { level: 0 | 1 | 2 | 3 | 4; label: string; barClass: string; badgeBg: string; badgeText: string };

function getOverLevel(rPct: number): OverLevel {
  if (rPct >= 400) return { level: 4, label: "초과 달성 Lv 4", barClass: "bg-purple-500/80 dark:bg-purple-400/70", badgeBg: "bg-purple-500/10", badgeText: "text-purple-600 dark:text-purple-400" };
  if (rPct >= 300) return { level: 3, label: "초과 달성 Lv 3", barClass: "bg-blue-500/80 dark:bg-blue-400/70", badgeBg: "bg-blue-500/10", badgeText: "text-blue-600 dark:text-blue-400" };
  if (rPct >= 200) return { level: 2, label: "초과 달성 Lv 2", barClass: "bg-amber-500/80 dark:bg-amber-400/70", badgeBg: "bg-amber-500/10", badgeText: "text-amber-600 dark:text-amber-400" };
  if (rPct > 100) return { level: 1, label: "초과 달성 Lv 1", barClass: "bg-rose-400/80 dark:bg-rose-500/70", badgeBg: "bg-rose-500/10", badgeText: "text-rose-600 dark:text-rose-400" };
  return { level: 0, label: "", barClass: "", badgeBg: "", badgeText: "" };
}

function getBaseFill(rPct: number): number { return Math.min(Math.max(rPct, 0), 100); }
function getOverFill(rPct: number): number {
  if (rPct >= 200) return 100; // full bar, differentiate by color
  return Math.min(Math.max(rPct - 100, 0), 100);
}

function statusBadge(progress: number | null) {
  if (progress == null) return null;
  const pct = progress * 100;
  const ol = getOverLevel(pct);
  if (ol.level > 0) return { label: ol.label, className: `${ol.badgeBg} ${ol.badgeText}` };
  if (pct >= 90) return { label: "순조", className: "bg-kpi-positive-bg text-kpi-positive" };
  if (pct >= 70) return { label: "주의", className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" };
  return { label: "위험", className: "bg-kpi-negative-bg text-kpi-negative" };
}

export function TargetProgressSection({ targets, revenue, students, conversion, onOpenSettings, debugInfo }: Props) {
  const [showDebug, setShowDebug] = useState(false);

  if (!targets) {
    // Still show debug even when no targets
    if (debugInfo && showDebug) {
      const currentKey = debugInfo.cohortNo != null
        ? makeTargetKey(debugInfo.instructorName, debugInfo.courseName, debugInfo.cohortNo)
        : "(cohortNo 없음)";
      const allSaved = loadAllTargets();
      const savedKeys = Object.keys(allSaved).slice(0, 5);
      const matchFound = debugInfo.cohortNo != null && currentKey in allSaved;

      return (
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">🔍 디버그 (목표 없음)</p>
              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setShowDebug(false)}>닫기</Button>
            </div>
            <div className="text-[10px] font-mono space-y-1 text-muted-foreground bg-muted/50 rounded p-2">
              <p><span className="text-foreground font-semibold">조회 key:</span> {currentKey}</p>
              <p><span className="text-foreground font-semibold">매칭:</span> <span className={matchFound ? "text-emerald-600" : "text-red-500"}>{matchFound ? "✅ 일치" : "❌ 불일치"}</span></p>
              <p><span className="text-foreground font-semibold">저장된 keys ({Object.keys(allSaved).length}):</span></p>
              {savedKeys.map((k) => <p key={k} className="pl-2">{k}</p>)}
              {Object.keys(allSaved).length > 5 && <p className="pl-2 text-muted-foreground/60">...외 {Object.keys(allSaved).length - 5}개</p>}
            </div>
          </CardContent>
        </Card>
      );
    }
    return debugInfo ? (
      <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground" onClick={() => setShowDebug(true)}>
        <Bug className="h-3 w-3 mr-1" /> 디버그
      </Button>
    ) : null;
  }

  const items = [
    {
      label: "매출",
      current: revenue,
      target: targets.revenue_target,
      formatCurrent: formatWonFull(revenue),
      formatTarget: targets.revenue_target != null ? formatWonFull(targets.revenue_target) : "—",
      formatRemaining: targets.revenue_target != null ? formatWonFull(calcRemaining(targets.revenue_target, revenue) ?? 0) : "—",
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
          <div className="flex items-center gap-1">
            {debugInfo && (
              <Button variant="ghost" size="sm" className="h-7 px-1.5 text-[10px] text-muted-foreground" onClick={() => setShowDebug(!showDebug)}>
                <Bug className="h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 text-[10px] text-muted-foreground" onClick={onOpenSettings}>
              목표 관리
            </Button>
          </div>
        </div>

        {showDebug && debugInfo && (() => {
          const currentKey = debugInfo.cohortNo != null
            ? makeTargetKey(debugInfo.instructorName, debugInfo.courseName, debugInfo.cohortNo)
            : "(cohortNo 없음)";
          const allSaved = loadAllTargets();
          const savedKeys = Object.keys(allSaved).slice(0, 5);
          const matchFound = debugInfo.cohortNo != null && currentKey in allSaved;
          return (
            <div className="text-[10px] font-mono space-y-1 text-muted-foreground bg-muted/50 rounded p-2 mb-3">
              <p><span className="text-foreground font-semibold">조회 key:</span> {currentKey}</p>
              <p><span className="text-foreground font-semibold">매칭:</span> <span className={matchFound ? "text-emerald-600" : "text-red-500"}>{matchFound ? "✅ 일치" : "❌ 불일치"}</span></p>
              <p><span className="text-foreground font-semibold">저장된 keys ({Object.keys(allSaved).length}):</span></p>
              {savedKeys.map((k) => <p key={k} className="pl-2">{k}</p>)}
            </div>
          );
        })()}
        <div className="grid gap-4 sm:grid-cols-3">
          {items.map((item) => {
            const badge = statusBadge(item.progress);
            const pctText = item.progress != null ? `${(item.progress * 100).toFixed(1)}%` : "—";
            const ratio = item.progress ?? 0;
            const greenW = Math.min(ratio, 1) * 100;  // 0~100%
            const redW = Math.min(Math.max(ratio - 1, 0), 1) * 100; // overflow 0~100%
            const hasTarget = item.target != null && item.target !== 0;
            const exceeded = ratio > 1;

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

                {/* Progress bar – 2-zone extend style */}
                <div className="relative flex h-1.5 w-full">
                  {/* Zone A: 0~100% (left half) */}
                  <div className="relative h-full w-1/2 overflow-hidden rounded-l-full bg-muted">
                    <div
                      className="absolute inset-y-0 left-0 bg-emerald-500 transition-all duration-500 ease-out"
                      style={{ width: `${greenW}%` }}
                    />
                  </div>
                  {/* 100% marker */}
                  {hasTarget && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="relative z-10 h-full w-[2px] -mx-px bg-foreground/25 cursor-default flex-shrink-0"
                          tabIndex={0}
                          aria-label="목표 100% 기준선"
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px]">
                        <p className="text-xs font-semibold">목표 100% 기준</p>
                        <p className="text-[10px] text-muted-foreground">왼쪽(초록) = 목표까지 달성</p>
                        <p className="text-[10px] text-muted-foreground">오른쪽(빨강) = 초과 달성 구간</p>
                        <p className="text-[10px] tabular-nums mt-0.5">목표: {item.formatTarget}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {/* Zone B: 100~200% (right half) */}
                  <div className="relative h-full w-1/2 overflow-hidden rounded-r-full bg-muted/50">
                    {redW > 0 && (
                      <div
                        className="absolute inset-y-0 left-0 bg-rose-400/80 dark:bg-rose-500/70 transition-all duration-500 ease-out"
                        style={{ width: `${redW}%` }}
                      />
                    )}
                  </div>
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
                  {exceeded && !item.isPct && item.target != null ? (
                    <span className="text-kpi-negative">
                      초과 +{item.label === "매출" ? formatWonFull(item.current - item.target) : `${formatInt(item.current - item.target)}명`}
                    </span>
                  ) : exceeded && item.isPct && item.deltaPp != null ? (
                    <span className="text-kpi-negative">
                      초과 +{item.deltaPp.toFixed(1)}pp
                    </span>
                  ) : item.isPct && item.deltaPp != null ? (
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
