import { useState, useMemo } from "react";
import { DollarSign, Users, TrendingUp, Layers, Receipt, Megaphone, PiggyBank, Percent, Target, AlertTriangle } from "lucide-react";
import { Layout, useLayoutActions } from "@/components/Layout";
import { KPICard } from "@/components/KPICard";
import { CohortTrendChart } from "@/components/CohortTrendChart";
import { FunnelTable } from "@/components/FunnelTable";
import { DashboardFilters } from "@/components/DashboardFilters";
import { KPIDetailSheet } from "@/components/KPIDetailSheet";
import { TargetProgressSection } from "@/components/TargetProgressSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useTargets, calcProgress } from "@/hooks/useTargets";
import { usePlatformCosts } from "@/hooks/usePlatformCosts";
import { getCohortCostSummary, type CohortCostSummary } from "@/lib/platformCostStore";
import { formatWonFull, formatInt, formatPct } from "@/lib/format";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { CohortKpi, Cohort } from "@/lib/types";
import { loadRawCohorts } from "@/lib/rawCohortStore";

type MetricKey = "revenue" | "students" | "leads" | "conversion";

function calcDelta(cur: number, base: number | null | undefined): number | null {
  if (base == null || base === 0) return null;
  return ((cur - base) / base) * 100;
}

function resolveCostSummary(kpi: CohortKpi | null): CohortCostSummary | null {
  if (!kpi) return null;
  const raw = loadRawCohorts().find(
    (r) => `inst-${r.instructor_name}` === kpi.instructor_id && `course-${r.course_title}` === kpi.course_id && r.cohort_no === kpi.cohort_no
  );
  if (!raw) return null;
  return getCohortCostSummary(raw.instructor_name, raw.course_title, raw.cohort_no, kpi.revenue);
}

const Index = () => {
  const { openRawData } = useLayoutActions();
  const [sheetMetric, setSheetMetric] = useState<MetricKey | null>(null);

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

  // Resolve instructor/course names from raw cohorts for target key
  const rawCohortsAll = useMemo(() => loadRawCohorts(), []);
  const currentInstName = rawCohortsAll.find((c) => `inst-${c.instructor_name}` === instructorId)?.instructor_name ?? "";
  const currentCourseName = rawCohortsAll.find((c) => `course-${c.course_title}` === courseId)?.course_title ?? "";
  const currentCohortNo = currentCohort?.cohort_no ?? null;
  const { targets } = useTargets(currentInstName, currentCourseName, currentCohortNo);
  // Subscribe to cost changes for reactivity
  const platformCosts = usePlatformCosts();

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

  const revenueProgress = currentKpi ? calcProgress(currentKpi.revenue, targets?.revenue_target ?? null) : null;
  const studentsProgress = currentKpi ? calcProgress(currentKpi.students, targets?.students_target ?? null) : null;
  const conversionProgress = currentKpi ? calcProgress(currentKpi.conversion, targets?.conversion_target ?? null) : null;

  // L1 cost data
  const currentCost = useMemo(() => resolveCostSummary(currentKpi), [currentKpi, platformCosts]);
  const baselineCost = useMemo(() => resolveCostSummary(baselineKpi), [baselineKpi, platformCosts]);

  // Sparkline for net profit across all kpis
  const netProfitSparkline = useMemo(() => {
    return kpis.map((k) => {
      const cs = resolveCostSummary(k);
      return cs ? cs.net_profit_l1 : 0;
    });
  }, [kpis, platformCosts]);

  // Net profit series for chart
  const netProfitSeries = useMemo(() => {
    return kpis.map((k) => {
      const cs = resolveCostSummary(k);
      return cs ? cs.net_profit_l1 : null;
    });
  }, [kpis, platformCosts]);

  return (
    <Layout defaultInstructor={instructorId} defaultCourse={courseId} defaultCohortNo={currentCohortNo}>
      <div className="space-y-0">
        <DashboardFilters
          instructorId={instructorId} courseId={courseId} cohortId={cohortId}
          instructors={instructors} courses={courses} cohorts={cohorts}
          onInstructorChange={handleInstructorChange} onCourseChange={handleCourseChange}
          onCohortChange={handleCohortChange} onReset={handleReset}
          compareMode={compareMode} onCompareModeChange={handleCompareModeChange}
          baselineCohortId={baselineCohortId} onBaselineChange={handleBaselineChange}
          baselineCohortNo={baselineCohort?.cohort_no ?? null}
        />

        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">대시보드</h2>
              <p className="text-xs text-muted-foreground mt-0.5">강사별 강의 KPI를 확인하세요</p>
            </div>
            {currentCohort && (
              <Badge variant={currentCohort.status === "active" ? "default" : currentCohort.status === "closed" ? "secondary" : "outline"} className="text-[10px] h-5">
                {statusLabel}
              </Badge>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
          )}

          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
            </div>
          ) : currentKpi ? (
            <TooltipProvider delayDuration={300}>
              <>
                {/* Core KPI Cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <KPICard title="매출" value={formatWonCompact(currentKpi.revenue)} deltaPct={getDelta("revenue")} deltaLabel={deltaLabel}
                          icon={<DollarSign className="h-4 w-4" />} sparklineData={sparklines.revenue} progress={revenueProgress} onClick={() => setSheetMetric("revenue")} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs tabular-nums">{formatWonFull(currentKpi.revenue)}</p>
                      {isComparing && baselineKpi && <p className="text-[10px] text-muted-foreground">기준({baselineCohort?.cohort_no}기): {formatWonFull(baselineKpi.revenue)}</p>}
                    </TooltipContent>
                  </Tooltip>
                  <KPICard title="수강생" value={`${formatInt(currentKpi.students)}명`} deltaPct={getDelta("students")} deltaLabel={deltaLabel}
                    icon={<Users className="h-4 w-4" />} sparklineData={sparklines.students} progress={studentsProgress} onClick={() => setSheetMetric("students")} />
                  <KPICard title="리드" value={`${formatInt(currentKpi.leads)}명`} deltaPct={getDelta("leads")} deltaLabel={deltaLabel}
                    icon={<Layers className="h-4 w-4" />} sparklineData={sparklines.leads} onClick={() => setSheetMetric("leads")} />
                  <KPICard title="전환율" value={`${currentKpi.conversion.toFixed(1)}%`} deltaPct={getDelta("conversion")} deltaLabel={deltaLabel}
                    secondaryText={`리드 기준 ${currentKpi.conversion_secondary.toFixed(1)}%`}
                    icon={<TrendingUp className="h-4 w-4" />} sparklineData={sparklines.conversion} progress={conversionProgress} onClick={() => setSheetMetric("conversion")} />
                </div>

                {/* L1 Profit KPI Cards */}
                <L1ProfitCards
                  currentCost={currentCost}
                  baselineCost={baselineCost}
                  isComparing={isComparing}
                  deltaLabel={deltaLabel}
                  netProfitSparkline={netProfitSparkline}
                />

                {/* Charts row */}
                <div className="grid gap-3 lg:grid-cols-2">
                  <CohortTrendChart kpis={kpis} baselineKpi={baselineKpi} isComparing={isComparing} netProfitSeries={netProfitSeries} />
                  <FunnelTable funnel={funnel} loading={isDetailLoading} baselineFunnel={isComparing ? baselineFunnel : null} baselineCohortNo={baselineCohort?.cohort_no ?? null} />
                </div>

                {/* Target Progress */}
                {currentKpi && (
                  <TargetProgressSection targets={targets} revenue={currentKpi.revenue} students={currentKpi.students}
                    conversion={currentKpi.conversion} onOpenSettings={() => openRawData("targets")} />
                )}

                {/* Target warning / Cohorts Overview */}
                {!targets && currentKpi && (
                  <Card className="border-yellow-500/30 bg-yellow-500/5">
                    <CardContent className="py-4 px-4 flex items-center gap-3">
                      <div className="rounded-full p-1.5 bg-yellow-500/10">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">목표가 설정되지 않았습니다</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {currentInstName && currentCourseName && currentCohortNo
                            ? `현재: ${currentInstName} / ${currentCourseName} / ${currentCohortNo}기`
                            : "목표를 설정하면 달성률(진행률)이 표시됩니다."}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 shrink-0" onClick={() => openRawData("targets")}>
                        <Target className="h-3 w-3" /> 목표 설정하기
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Cohorts Overview table */}
                <CohortsOverview kpis={kpis} cohorts={cohorts} currentCohortId={cohortId}
                  baselineCohortId={baselineCohortId} isComparing={isComparing} />
              </>
            </TooltipProvider>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-card">
              <p className="text-sm text-muted-foreground">강사와 강의를 선택해주세요</p>
            </div>
          )}
        </div>
      </div>

      <KPIDetailSheet open={!!sheetMetric} onOpenChange={(o) => !o && setSheetMetric(null)} metric={sheetMetric} kpis={kpis} />
    </Layout>
  );
};

// ── L1 Profit Cards ──
function L1ProfitCards({
  currentCost, baselineCost, isComparing, deltaLabel, netProfitSparkline,
}: {
  currentCost: CohortCostSummary | null;
  baselineCost: CohortCostSummary | null;
  isComparing: boolean;
  deltaLabel: string;
  netProfitSparkline: number[];
}) {
  const { openRawData } = useLayoutActions();
  const hasCost = !!currentCost;

  const feeDelta = hasCost && isComparing && baselineCost ? calcDelta(currentCost.total_fee, baselineCost.total_fee) : null;
  const adsDelta = hasCost && isComparing && baselineCost ? calcDelta(currentCost.total_ads, baselineCost.total_ads) : null;
  const profitDelta = hasCost && isComparing && baselineCost ? calcDelta(currentCost.net_profit_l1, baselineCost.net_profit_l1) : null;
  const marginDelta = hasCost && isComparing && baselineCost && baselineCost.net_margin_l1 != null && currentCost.net_margin_l1 != null
    ? currentCost.net_margin_l1 - baselineCost.net_margin_l1 : null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-stretch mt-3">
      <KPICard
        title="수수료"
        value={hasCost ? formatWonCompact(currentCost.total_fee) : "—"}
        deltaPct={feeDelta}
        deltaLabel={hasCost ? deltaLabel : undefined}
        icon={<Receipt className="h-4 w-4" />}
        secondaryText={!hasCost ? undefined : undefined}
      />
      <KPICard
        title="광고비"
        value={hasCost ? formatWonCompact(currentCost.total_ads) : "—"}
        deltaPct={adsDelta}
        deltaLabel={hasCost ? deltaLabel : undefined}
        icon={<Megaphone className="h-4 w-4" />}
      />
      <KPICard
        title="순이익 (L1)"
        value={hasCost ? formatWonCompact(currentCost.net_profit_l1) : "—"}
        deltaPct={profitDelta}
        deltaLabel={hasCost ? deltaLabel : undefined}
        icon={<PiggyBank className="h-4 w-4" />}
        sparklineData={netProfitSparkline.some((v) => v !== 0) ? netProfitSparkline : undefined}
        secondaryText={!hasCost ? undefined : undefined}
      />
      <KPICard
          title="순이익률 (L1)"
          value={hasCost && currentCost.net_margin_l1 != null ? `${currentCost.net_margin_l1.toFixed(1)}%` : "—"}
          deltaPct={marginDelta}
          deltaLabel={hasCost ? deltaLabel : undefined}
          icon={<Percent className="h-4 w-4" />}
        />
    </div>
  );
}

// ── Cohorts Overview Table ──
function CohortsOverview({
  kpis, cohorts, currentCohortId, baselineCohortId, isComparing,
}: {
  kpis: CohortKpi[]; cohorts: Cohort[]; currentCohortId: string; baselineCohortId: string; isComparing: boolean;
}) {
  const platformCosts = usePlatformCosts();

  if (!kpis || kpis.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-1 px-4 pt-4"><CardTitle className="text-sm font-semibold">기수 요약</CardTitle></CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="overflow-x-auto">
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
                <TableHead className="h-8 text-[10px] uppercase tracking-widest px-2 text-right">수수료</TableHead>
                <TableHead className="h-8 text-[10px] uppercase tracking-widest px-2 text-right">광고비</TableHead>
                <TableHead className="h-8 text-[10px] uppercase tracking-widest px-2 text-right">순이익</TableHead>
                <TableHead className="h-8 text-[10px] uppercase tracking-widest px-2 text-right">순이익률</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpis.map((k) => {
                const isCurrent = k.cohort_id === currentCohortId;
                const isBaseline = isComparing && k.cohort_id === baselineCohortId;
                const cost = resolveCostSummary(k);
                return (
                  <TableRow key={k.cohort_id}
                    className={`border-b border-border/30 hover:bg-muted/30 transition-colors ${isCurrent ? "bg-primary/5" : ""} ${isBaseline ? "bg-accent/30" : ""}`}>
                    <TableCell className="py-2 px-2 text-xs font-medium">
                      {k.cohort_no}기
                      {isCurrent && <span className="ml-1 text-[9px] text-primary">(현재)</span>}
                      {isBaseline && <span className="ml-1 text-[9px] text-muted-foreground">(기준)</span>}
                    </TableCell>
                    <TableCell className="py-2 px-2 text-xs">
                      <Badge variant={k.status === "active" ? "default" : k.status === "closed" ? "secondary" : "outline"} className="text-[9px] h-4 px-1.5">
                        {k.status === "active" ? "운영중" : k.status === "closed" ? "종료" : "계획"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 px-2 text-xs text-muted-foreground">{k.start_date ?? "—"}</TableCell>
                    <TableCell className="py-2 px-2 text-xs text-right tabular-nums font-medium">
                      <Tooltip><TooltipTrigger asChild><span>{formatWonCompact(k.revenue)}</span></TooltipTrigger>
                        <TooltipContent><p className="text-xs tabular-nums">{formatWonFull(k.revenue)}</p></TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="py-2 px-2 text-xs text-right tabular-nums">{formatInt(k.students)}명</TableCell>
                    <TableCell className="py-2 px-2 text-xs text-right tabular-nums">{formatInt(k.leads)}명</TableCell>
                    <TableCell className="py-2 px-2 text-xs text-right tabular-nums">{formatInt(k.applied)}명</TableCell>
                    <TableCell className="py-2 px-2 text-xs text-right tabular-nums">{k.conversion.toFixed(1)}%</TableCell>
                    <TableCell className="py-2 px-2 text-xs text-right tabular-nums text-muted-foreground">{cost ? formatWonCompact(cost.total_fee) : "—"}</TableCell>
                    <TableCell className="py-2 px-2 text-xs text-right tabular-nums text-muted-foreground">{cost ? formatWonCompact(cost.total_ads) : "—"}</TableCell>
                    <TableCell className="py-2 px-2 text-xs text-right tabular-nums font-medium">{cost ? formatWonCompact(cost.net_profit_l1) : "—"}</TableCell>
                    <TableCell className="py-2 px-2 text-xs text-right tabular-nums">{cost?.net_margin_l1 != null ? `${cost.net_margin_l1.toFixed(1)}%` : "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default Index;
