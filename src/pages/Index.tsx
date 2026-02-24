import { useState } from "react";
import { DollarSign, Users, TrendingUp, Layers, Target } from "lucide-react";
import { Layout } from "@/components/Layout";
import { KPICard } from "@/components/KPICard";
import { CohortTrendChart } from "@/components/CohortTrendChart";
import { FunnelTable } from "@/components/FunnelTable";
import { DashboardFilters } from "@/components/DashboardFilters";
import { KPIDetailSheet } from "@/components/KPIDetailSheet";
import { TargetSettingSheet } from "@/components/TargetSettingSheet";
import { TargetProgressSection } from "@/components/TargetProgressSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useTargets, calcProgress } from "@/hooks/useTargets";
import { formatWonCompact, formatWonFull, formatInt } from "@/lib/format";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { CohortKpi } from "@/lib/types";

type MetricKey = "revenue" | "students" | "leads" | "conversion";

function calcDelta(cur: number, base: number | null | undefined): number | null {
  if (base == null || base === 0) return null;
  return ((cur - base) / base) * 100;
}

const Index = () => {
  const [sheetMetric, setSheetMetric] = useState<MetricKey | null>(null);
  const [targetSheetOpen, setTargetSheetOpen] = useState(false);

  const {
    instructorId, courseId, cohortId,
    handleInstructorChange, handleCourseChange, handleCohortChange, handleReset,
    instructors, courses, cohorts, kpis,
    currentKpi, currentCohort,
    sparklines,
    funnel,
    compareMode, handleCompareModeChange,
    baselineCohortId, handleBaselineChange,
    baselineKpi, baselineCohort, baselineFunnel,
    loadState, detailLoadState, error,
  } = useDashboardData();

  const { targets, setTargets, clearTargets } = useTargets(instructorId, courseId);

  const isComparing = compareMode !== "off" && !!baselineKpi;

  const getDelta = (metric: "revenue" | "students" | "leads" | "conversion") => {
    if (!currentKpi) return null;
    if (isComparing && baselineKpi) {
      if (metric === "conversion") return calcDelta(currentKpi.conversion, baselineKpi.conversion);
      return calcDelta(currentKpi[metric], baselineKpi[metric]);
    }
    return currentKpi[`${metric}_delta_pct` as keyof CohortKpi] as number | null;
  };

  const statusLabel = currentCohort?.status === "active" ? "운영중" : currentCohort?.status === "closed" ? "종료" : "계획";
  const isLoading = loadState === "loading";
  const isDetailLoading = detailLoadState === "loading";
  const deltaLabel = isComparing ? `vs ${baselineCohort?.cohort_no}기` : "vs 전기수";

  // Progress for KPI cards
  const revenueProgress = currentKpi ? calcProgress(currentKpi.revenue, targets?.revenue_target ?? null) : null;
  const studentsProgress = currentKpi ? calcProgress(currentKpi.students, targets?.students_target ?? null) : null;
  const conversionProgress = currentKpi ? calcProgress(currentKpi.conversion, targets?.conversion_target ?? null) : null;

  return (
    <Layout>
      <div className="space-y-0">
        <DashboardFilters
          instructorId={instructorId}
          courseId={courseId}
          cohortId={cohortId}
          instructors={instructors}
          courses={courses}
          cohorts={cohorts}
          onInstructorChange={handleInstructorChange}
          onCourseChange={handleCourseChange}
          onCohortChange={handleCohortChange}
          onReset={handleReset}
          compareMode={compareMode}
          onCompareModeChange={handleCompareModeChange}
          baselineCohortId={baselineCohortId}
          onBaselineChange={handleBaselineChange}
          baselineCohortNo={baselineCohort?.cohort_no ?? null}
        />

        <div className="space-y-6 pt-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">대시보드</h2>
              <p className="text-xs text-muted-foreground mt-0.5">강사별 강의 KPI를 확인하세요</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setTargetSheetOpen(true)}
              >
                <Target className="h-3 w-3" />
                {targets ? "목표 수정" : "목표 설정"}
              </Button>
              {currentCohort && (
                <Badge
                  variant={currentCohort.status === "active" ? "default" : currentCohort.status === "closed" ? "secondary" : "outline"}
                  className="text-[10px] h-5"
                >
                  {statusLabel}
                </Badge>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* KPI Cards */}
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : currentKpi ? (
            <TooltipProvider delayDuration={300}>
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <KPICard
                          title="매출"
                          value={formatWonCompact(currentKpi.revenue)}
                          deltaPct={getDelta("revenue")}
                          deltaLabel={deltaLabel}
                          icon={<DollarSign className="h-4 w-4" />}
                          sparklineData={sparklines.revenue}
                          progress={revenueProgress}
                          onClick={() => setSheetMetric("revenue")}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs tabular-nums">{formatWonFull(currentKpi.revenue)}</p>
                      {isComparing && baselineKpi && (
                        <p className="text-[10px] text-muted-foreground">기준({baselineCohort?.cohort_no}기): {formatWonFull(baselineKpi.revenue)}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                  <KPICard
                    title="수강생"
                    value={`${formatInt(currentKpi.students)}명`}
                    deltaPct={getDelta("students")}
                    deltaLabel={deltaLabel}
                    icon={<Users className="h-4 w-4" />}
                    sparklineData={sparklines.students}
                    progress={studentsProgress}
                    onClick={() => setSheetMetric("students")}
                  />
                  <KPICard
                    title="리드"
                    value={`${formatInt(currentKpi.leads)}명`}
                    deltaPct={getDelta("leads")}
                    deltaLabel={deltaLabel}
                    icon={<Layers className="h-4 w-4" />}
                    sparklineData={sparklines.leads}
                    onClick={() => setSheetMetric("leads")}
                  />
                  <KPICard
                    title="전환율"
                    value={`${currentKpi.conversion.toFixed(1)}%`}
                    deltaPct={getDelta("conversion")}
                    deltaLabel={deltaLabel}
                    secondaryText={`리드 기준 ${currentKpi.conversion_secondary.toFixed(1)}%`}
                    icon={<TrendingUp className="h-4 w-4" />}
                    sparklineData={sparklines.conversion}
                    progress={conversionProgress}
                    onClick={() => setSheetMetric("conversion")}
                  />
                </div>

                {/* Charts row */}
                <div className="grid gap-3 lg:grid-cols-2">
                  <CohortTrendChart kpis={kpis} baselineKpi={baselineKpi} isComparing={isComparing} />
                  <FunnelTable funnel={funnel} loading={isDetailLoading} baselineFunnel={isComparing ? baselineFunnel : null} baselineCohortNo={baselineCohort?.cohort_no ?? null} />
                </div>

                {/* Target Progress */}
                {currentKpi && (
                  <TargetProgressSection
                    targets={targets}
                    revenue={currentKpi.revenue}
                    students={currentKpi.students}
                    conversion={currentKpi.conversion}
                    onOpenSettings={() => setTargetSheetOpen(true)}
                  />
                )}

                {/* Cohorts Overview table */}
                <CohortsOverview kpis={kpis} currentCohortId={cohortId} baselineCohortId={baselineCohortId} isComparing={isComparing} />
              </>
            </TooltipProvider>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-card">
              <p className="text-sm text-muted-foreground">강사와 강의를 선택해주세요</p>
            </div>
          )}
        </div>
      </div>

      <KPIDetailSheet
        open={!!sheetMetric}
        onOpenChange={(o) => !o && setSheetMetric(null)}
        metric={sheetMetric}
        kpis={kpis}
      />

      <TargetSettingSheet
        open={targetSheetOpen}
        onOpenChange={setTargetSheetOpen}
        targets={targets}
        onSave={setTargets}
        onClear={clearTargets}
      />
    </Layout>
  );
};

// ── Cohorts Overview Table ──
function CohortsOverview({ kpis, currentCohortId, baselineCohortId, isComparing }: { kpis: CohortKpi[]; currentCohortId: string; baselineCohortId: string; isComparing: boolean }) {
  if (!kpis || kpis.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-1 px-4 pt-4">
        <CardTitle className="text-sm font-semibold">기수 요약</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/50">
              <TableHead className="h-8 text-[10px] uppercase tracking-widest px-2">기수</TableHead>
              <TableHead className="h-8 text-[10px] uppercase tracking-widest px-2">상태</TableHead>
              <TableHead className="h-8 text-[10px] uppercase tracking-widest px-2">시작일</TableHead>
              <TableHead className="h-8 text-[10px] uppercase tracking-widest px-2 text-right">매출</TableHead>
              <TableHead className="h-8 text-[10px] uppercase tracking-widest px-2 text-right">수강생</TableHead>
              <TableHead className="h-8 text-[10px] uppercase tracking-widest px-2 text-right">리드</TableHead>
              <TableHead className="h-8 text-[10px] uppercase tracking-widest px-2 text-right">지원</TableHead>
              <TableHead className="h-8 text-[10px] uppercase tracking-widest px-2 text-right">전환율</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kpis.map((k) => {
              const isCurrent = k.cohort_id === currentCohortId;
              const isBaseline = isComparing && k.cohort_id === baselineCohortId;
              return (
                <TableRow
                  key={k.cohort_id}
                  className={`border-b border-border/30 hover:bg-muted/30 transition-colors ${isCurrent ? "bg-primary/5" : ""} ${isBaseline ? "bg-accent/30" : ""}`}
                >
                  <TableCell className="py-2 px-2 text-xs font-medium">
                    {k.cohort_no}기
                    {isCurrent && <span className="ml-1 text-[9px] text-primary">(현재)</span>}
                    {isBaseline && <span className="ml-1 text-[9px] text-muted-foreground">(기준)</span>}
                  </TableCell>
                  <TableCell className="py-2 px-2 text-xs">
                    <Badge
                      variant={k.status === "active" ? "default" : k.status === "closed" ? "secondary" : "outline"}
                      className="text-[9px] h-4 px-1.5"
                    >
                      {k.status === "active" ? "운영중" : k.status === "closed" ? "종료" : "계획"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 px-2 text-xs text-muted-foreground">{k.start_date ?? "—"}</TableCell>
                  <TableCell className="py-2 px-2 text-xs text-right tabular-nums font-medium">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{formatWonCompact(k.revenue)}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs tabular-nums">{formatWonFull(k.revenue)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="py-2 px-2 text-xs text-right tabular-nums">{formatInt(k.students)}명</TableCell>
                  <TableCell className="py-2 px-2 text-xs text-right tabular-nums">{formatInt(k.leads)}명</TableCell>
                  <TableCell className="py-2 px-2 text-xs text-right tabular-nums">{formatInt(k.applied)}명</TableCell>
                  <TableCell className="py-2 px-2 text-xs text-right tabular-nums">{k.conversion.toFixed(1)}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default Index;
