import { useState, useMemo } from "react";
import { DollarSign, Users, TrendingUp, Layers, Receipt, Megaphone, Percent, Target, AlertTriangle, Wallet, ChevronDown, ChevronRight, Info, Radio, CreditCard } from "lucide-react";
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
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { CohortKpi, Cohort } from "@/lib/types";
import { loadRawCohorts, type RawCohort } from "@/lib/rawCohortStore";
import { useRawCohortStore } from "@/hooks/useRawCohortStore";
import { SectionHeader } from "@/components/SectionHeader";

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

/** Get total_sales from njab details if available */
function resolveNjabTotalSales(kpi: CohortKpi | null): number | null {
  if (!kpi) return null;
  const raw = loadRawCohorts().find(
    (r) => `inst-${r.instructor_name}` === kpi.instructor_id && `course-${r.course_title}` === kpi.course_id && r.cohort_no === kpi.cohort_no
  );
  if (!raw) return null;
  const { getCostsForCohort } = require("@/lib/platformCostStore");
  const costs = getCostsForCohort(raw.instructor_name, raw.course_title, raw.cohort_no);
  for (const c of costs) {
    if (c.platform_key === "njab" && c.details && typeof c.details.total_sales === "number") {
      return c.details.total_sales as number;
    }
  }
  return null;
}

const Index = () => {
  const { openRawData } = useLayoutActions();
  const [sheetMetric, setSheetMetric] = useState<MetricKey | null>(null);

  const {
    instructorId, courseId, cohortId,
    handleInstructorChange, handleCourseChange, handleCohortChange, handleCohortSelect, handleReset,
    instructors, courses, cohorts, kpis,
    currentKpi, currentCohort,
    sparklines,
    funnel,
    compareMode, handleCompareModeChange,
    baselineCohortId, handleBaselineChange,
    baselineKpi, baselineCohort, baselineFunnel,
    crossInstructorId, handleCrossInstructorChange,
    crossCourseId, handleCrossCourseChange, crossCourses,
    crossCohortId, handleCrossCohortChange, crossCohorts,
    crossBaselineLabel, isSameCohort,
    loadState, detailLoadState, error,
  } = useDashboardData();

  // Resolve instructor/course names from raw cohorts for target key
  const rawStoreSnapshot = useRawCohortStore();
  const rawCohortsAll = useMemo(() => loadRawCohorts(), [rawStoreSnapshot]);
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
  const deltaLabel = isComparing
    ? (compareMode === "cross" && crossBaselineLabel ? `vs ${crossBaselineLabel}` : `vs ${baselineCohort?.cohort_no}기`)
    : "vs 전기수";

  const revenueProgress = currentKpi ? calcProgress(currentKpi.revenue, targets?.revenue_target ?? null) : null;
  const studentsProgress = currentKpi ? calcProgress(currentKpi.students, targets?.students_target ?? null) : null;
  const conversionProgress = currentKpi ? calcProgress(currentKpi.conversion, targets?.conversion_target ?? null) : null;

  // L1 cost data
  const currentCost = useMemo(() => resolveCostSummary(currentKpi), [currentKpi, platformCosts]);
  const baselineCost = useMemo(() => resolveCostSummary(baselineKpi), [baselineKpi, platformCosts]);

  // Sparkline for payout (실지급액) across all kpis
  const payoutSparkline = useMemo(() => {
    return kpis.map((k) => {
      const cs = resolveCostSummary(k);
      return cs?.payout ?? 0;
    });
  }, [kpis, platformCosts]);

  // Payout series for chart (null = no data)
  const payoutSeries = useMemo(() => {
    return kpis.map((k) => {
      const cs = resolveCostSummary(k);
      return cs?.payout ?? null;
    });
  }, [kpis, platformCosts]);

  return (
    <Layout defaultInstructor={instructorId} defaultCourse={courseId} defaultCohortNo={currentCohortNo}>
      <div className="space-y-0">
        <DashboardFilters
          instructorId={instructorId}
          instructors={instructors}
          onInstructorChange={handleInstructorChange}
          onReset={handleReset}
          compareMode={compareMode} onCompareModeChange={handleCompareModeChange}
          baselineCohortId={baselineCohortId} onBaselineChange={handleBaselineChange}
          cohorts={cohorts} cohortId={cohortId}
          baselineCohortNo={baselineCohort?.cohort_no ?? null}
          crossInstructorId={crossInstructorId}
          onCrossInstructorChange={handleCrossInstructorChange}
          crossCourses={crossCourses}
          crossCourseId={crossCourseId}
          onCrossCourseChange={handleCrossCourseChange}
          crossCohorts={crossCohorts}
          crossCohortId={crossCohortId}
          onCrossCohortChange={handleCrossCohortChange}
          crossBaselineLabel={crossBaselineLabel}
          isSameCohort={isSameCohort}
        />

        <div className="space-y-7 pt-8">

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
                {/* Cohorts Overview — grouped by course */}
                <div className="section-container">
                  <SectionHeader title="기수 요약" subtitle="행을 클릭하면 해당 기수로 전환됩니다" />
                  <GroupedCohortsOverview
                    instructorId={instructorId}
                    currentCohortId={cohortId}
                    baselineCohortId={baselineCohortId}
                    isComparing={isComparing}
                    onCohortClick={handleCohortSelect}
                  />
                </div>

                {/* KPI Section Container */}
                 <div className="section-container space-y-3">
                   <SectionHeader title="KPI 요약" subtitle={currentCohort ? `${currentCohort.cohort_no}기 기준` : undefined} />
                   {/* Core KPI Cards */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <KPICard title="매출" value={formatWonFull(currentKpi.revenue)} deltaPct={getDelta("revenue")} deltaLabel={deltaLabel}
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

                  {/* Settlement / Payout KPI Cards */}
                  <SettlementCards
                    currentCost={currentCost}
                    baselineCost={baselineCost}
                    isComparing={isComparing}
                    deltaLabel={deltaLabel}
                    payoutSparkline={payoutSparkline}
                  />
                </div>

                {/* Charts row */}
                <div className="section-container">
                  <SectionHeader title="추이 및 퍼널" subtitle={`최근 ${kpis.length}개 기수`} />
                  <div className="grid gap-3 lg:grid-cols-2">
                    <CohortTrendChart kpis={kpis} baselineKpi={baselineKpi} isComparing={isComparing} netProfitSeries={payoutSeries} />
                    <FunnelTable funnel={funnel} loading={isDetailLoading} baselineFunnel={isComparing ? baselineFunnel : null} baselineCohortNo={baselineCohort?.cohort_no ?? null} />
                  </div>
                </div>

                {/* Target Progress */}
                {currentKpi && (
                  <div className="section-container">
                    <SectionHeader title="목표 대비" subtitle={currentCohort ? `${currentCohort.cohort_no}기 기준` : undefined} />
                    <TargetProgressSection targets={targets} revenue={currentKpi.revenue} students={currentKpi.students}
                      conversion={currentKpi.conversion} onOpenSettings={() => openRawData("targets")}
                      debugInfo={{ instructorName: currentInstName, courseName: currentCourseName, cohortNo: currentCohortNo }} />
                  </div>
                )}

                {/* Target warning */}
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

// ── Settlement / Payout Cards ──
function SettlementCards({
  currentCost, baselineCost, isComparing, deltaLabel, payoutSparkline,
}: {
  currentCost: CohortCostSummary | null;
  baselineCost: CohortCostSummary | null;
  isComparing: boolean;
  deltaLabel: string;
  payoutSparkline: number[];
}) {
  const { openRawData } = useLayoutActions();
  const hasCost = !!currentCost;
  const hasPayout = currentCost?.payout != null;

  const feeDelta = hasCost && isComparing && baselineCost ? calcDelta(currentCost.total_fee, baselineCost.total_fee) : null;
  const adsDelta = hasCost && isComparing && baselineCost ? calcDelta(currentCost.total_ads, baselineCost.total_ads) : null;
  const settleDelta = hasPayout && isComparing && baselineCost?.settlement_total != null
    ? calcDelta(currentCost.settlement_total!, baselineCost.settlement_total) : null;
  const payoutDelta = hasPayout && isComparing && baselineCost?.payout != null
    ? calcDelta(currentCost.payout!, baselineCost.payout) : null;
  const payoutMarginDelta = hasPayout && isComparing && baselineCost?.payout_margin != null && currentCost.payout_margin != null
    ? currentCost.payout_margin - baselineCost.payout_margin : null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-stretch mt-3">
      <KPICard
        title="수수료"
        value={hasCost ? formatWonFull(currentCost.total_fee) : "—"}
        deltaPct={feeDelta}
        deltaLabel={hasCost ? deltaLabel : undefined}
        icon={<Receipt className="h-4 w-4" />}
      />
      <KPICard
        title="광고비"
        value={hasCost ? formatWonFull(currentCost.total_ads) : "—"}
        deltaPct={adsDelta}
        deltaLabel={hasCost ? deltaLabel : undefined}
        icon={<Megaphone className="h-4 w-4" />}
      />
      <KPICard
        title="정산금 합계"
        value={hasPayout ? formatWonFull(currentCost.settlement_total!) : "—"}
        deltaPct={settleDelta}
        deltaLabel={hasPayout ? deltaLabel : undefined}
        icon={<Calculator className="h-4 w-4" />}
        secondaryText={!hasPayout ? "플랫폼 정산 폼 입력 필요" : undefined}
      />
      <KPICard
        title="순이익 (실지급액)"
        value={hasPayout ? formatWonFull(currentCost.payout!) : "—"}
        deltaPct={payoutDelta}
        deltaLabel={hasPayout ? deltaLabel : undefined}
        icon={<Wallet className="h-4 w-4" />}
        sparklineData={payoutSparkline.some((v) => v !== 0) ? payoutSparkline : undefined}
        secondaryText={!hasPayout ? "플랫폼 정산 폼 입력 필요" : undefined}
      />
      <KPICard
        title="순이익률 (실지급률)"
        value={hasPayout && currentCost.payout_margin != null ? `${currentCost.payout_margin.toFixed(1)}%` : "—"}
        deltaPct={payoutMarginDelta}
        deltaLabel={hasPayout ? deltaLabel : undefined}
        icon={<Percent className="h-4 w-4" />}
        secondaryText={!hasPayout ? "플랫폼 정산 폼 입력 필요" : undefined}
      />
    </div>
  );
}

// ── Grouped Cohorts Overview (by course, with accordion) ──
interface CourseGroup {
  courseId: string;
  courseTitle: string;
  cohorts: RawCohort[];
  activeCount: number;
  totalCount: number;
}

function GroupedCohortsOverview({
  instructorId, currentCohortId, baselineCohortId, isComparing, onCohortClick,
}: {
  instructorId: string;
  currentCohortId: string;
  baselineCohortId: string;
  isComparing: boolean;
  onCohortClick: (courseId: string, cohortId: string) => void;
}) {
  const rawStoreSnapshot = useRawCohortStore();
  const platformCosts = usePlatformCosts();

  const groups = useMemo(() => {
    const rawAll = loadRawCohorts();
    const instName = instructorId.replace("inst-", "");
    const filtered = rawAll.filter((r) => r.instructor_name === instName);
    const courseMap = new Map<string, RawCohort[]>();
    for (const r of filtered) {
      const list = courseMap.get(r.course_title) || [];
      list.push(r);
      courseMap.set(r.course_title, list);
    }
    const result: CourseGroup[] = [];
    for (const [title, cohorts] of courseMap) {
      const sorted = [...cohorts].sort((a, b) => a.cohort_no - b.cohort_no);
      result.push({
        courseId: `course-${title}`,
        courseTitle: title,
        cohorts: sorted,
        activeCount: sorted.filter((c) => c.status === "active" || c.status === "planned").length,
        totalCount: sorted.length,
      });
    }
    return result;
  }, [instructorId, rawStoreSnapshot]);

  // Default open: groups with active/planned cohorts
  const defaultOpen = useMemo(() => {
    return groups.filter((g) => g.activeCount > 0).map((g) => g.courseId);
  }, [groups]);

  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(defaultOpen));

  // Sync default open when groups change
  useMemo(() => {
    setOpenGroups(new Set(defaultOpen));
  }, [defaultOpen]);

  const toggleGroup = (courseId: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  if (groups.length === 0) return null;

  return (
    <div className="space-y-2">
      {groups.map((group) => {
        const isOpen = openGroups.has(group.courseId);
        return (
          <Card key={group.courseId} className="overflow-hidden">
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.courseId)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm font-semibold text-foreground flex-1 truncate">
                {group.courseTitle}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {group.activeCount > 0 && (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400">
                    운영중 {group.activeCount}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  총 {group.totalCount}개 기수
                </span>
              </div>
            </button>

            {/* Cohort rows */}
            {isOpen && (
              <CardContent className="px-0 py-0 border-t border-border/40">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border/30 bg-muted/20">
                        <TableHead className="h-7 text-[10px] uppercase tracking-widest px-3 font-medium text-muted-foreground">기수</TableHead>
                        <TableHead className="h-7 text-[10px] uppercase tracking-widest px-2 font-medium text-muted-foreground">상태</TableHead>
                        <TableHead className="h-7 text-[10px] uppercase tracking-widest px-2 font-medium text-muted-foreground">시작일</TableHead>
                        <TableHead className="h-7 text-[10px] uppercase tracking-widest px-2 text-right font-medium text-muted-foreground">매출</TableHead>
                        <TableHead className="h-7 text-[10px] uppercase tracking-widest px-2 text-right font-medium text-muted-foreground">수강생</TableHead>
                        <TableHead className="h-7 text-[10px] uppercase tracking-widest px-2 text-right font-medium text-muted-foreground">전환율</TableHead>
                        <TableHead className="h-7 text-[10px] uppercase tracking-widest px-2 text-right font-medium text-muted-foreground">순이익(실지급)</TableHead>
                        <TableHead className="h-7 text-[10px] uppercase tracking-widest px-2 text-right font-medium text-muted-foreground">실지급률</TableHead>
                        <TableHead className="h-7 text-[10px] uppercase tracking-widest px-2 font-medium text-muted-foreground">정산</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.cohorts.map((raw) => {
                        const cohortId = raw.id;
                        const isCurrent = cohortId === currentCohortId;
                        const isBaseline = isComparing && cohortId === baselineCohortId;
                        const conv = raw.applied > 0 ? (raw.students / raw.applied) * 100 : 0;
                        const cost = getCohortCostSummary(raw.instructor_name, raw.course_title, raw.cohort_no, raw.revenue);
                        return (
                          <TableRow
                            key={cohortId}
                            onClick={() => onCohortClick(group.courseId, cohortId)}
                            className={`border-b border-border/20 hover:bg-muted/30 transition-colors cursor-pointer ${isCurrent ? "bg-primary/8 ring-1 ring-inset ring-primary/20" : ""} ${isBaseline ? "bg-accent/30" : ""}`}
                          >
                            <TableCell className="py-2 px-3 text-xs font-medium">
                              {raw.cohort_no}기
                              {isBaseline && <span className="ml-1 text-[9px] text-muted-foreground">(기준)</span>}
                            </TableCell>
                            <TableCell className="py-2 px-2 text-xs">
                              <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${
                                raw.status === "active"
                                  ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400"
                                  : raw.status === "closed"
                                  ? "bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400"
                                  : "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400"
                              }`}>
                                {raw.status === "active" ? "운영중" : raw.status === "closed" ? "종료" : "계획"}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2 px-2 text-xs text-muted-foreground">{raw.start_date ?? "—"}</TableCell>
                            <TableCell className="py-2 px-2 text-xs text-right tabular-nums font-medium">{formatWonFull(raw.revenue)}</TableCell>
                            <TableCell className="py-2 px-2 text-xs text-right tabular-nums">{formatInt(raw.students)}명</TableCell>
                            <TableCell className="py-2 px-2 text-xs text-right tabular-nums">{conv.toFixed(1)}%</TableCell>
                            <TableCell className="py-2 px-2 text-xs text-right tabular-nums font-medium">{cost?.payout != null ? formatWonFull(cost.payout) : "—"}</TableCell>
                            <TableCell className="py-2 px-2 text-xs text-right tabular-nums">{cost?.payout_margin != null ? `${cost.payout_margin.toFixed(1)}%` : "—"}</TableCell>
                            <TableCell className="py-2 px-2 text-xs">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className={`text-[9px] h-4 px-1.5 cursor-default ${
                                    raw.settlement_status === "지급완료"
                                      ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400"
                                      : raw.settlement_status === "결재중"
                                      ? "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400"
                                      : "bg-muted text-muted-foreground border-border"
                                  }`}>
                                    {raw.settlement_status ?? "미정산"}
                                  </Badge>
                                </TooltipTrigger>
                                {raw.settlement_status === "지급완료" && (raw.settled_at || raw.settled_amount != null) && (
                                  <TooltipContent side="left" className="text-xs space-y-0.5">
                                    {raw.settled_at && <p>입금일: {raw.settled_at}</p>}
                                    {raw.settled_amount != null && <p>입금액: {formatWonFull(raw.settled_amount)}</p>}
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

export default Index;
