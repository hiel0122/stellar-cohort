import { useState } from "react";
import { DollarSign, Users, TrendingUp, Layers } from "lucide-react";
import { Layout } from "@/components/Layout";
import { KPICard } from "@/components/KPICard";
import { CohortTrendChart } from "@/components/CohortTrendChart";
import { FunnelTable } from "@/components/FunnelTable";
import { DashboardFilters } from "@/components/DashboardFilters";
import { KPIDetailSheet } from "@/components/KPIDetailSheet";
import { ChecklistWidget } from "@/components/ChecklistWidget";
import { RecentEnrollmentsTable } from "@/components/RecentEnrollmentsTable";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/useDashboardData";

type MetricKey = "revenue" | "students" | "leads" | "conversion";

const Index = () => {
  const [sheetMetric, setSheetMetric] = useState<MetricKey | null>(null);

  const {
    instructorId, courseId, cohortId,
    handleInstructorChange, handleCourseChange, handleCohortChange, handleReset,
    instructors, courses, cohorts, kpis,
    currentKpi, currentCohort,
    sparklines,
    funnel, checklist, enrollments,
    loadState, detailLoadState, error,
  } = useDashboardData();

  const formatKRW = (v: number) => `₩${(v / 10000).toLocaleString()}만`;
  const statusLabel = currentCohort?.status === "active" ? "운영중" : currentCohort?.status === "closed" ? "종료" : "계획";

  const isLoading = loadState === "loading";
  const isDetailLoading = detailLoadState === "loading";

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
        />

        <div className="space-y-6 pt-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">대시보드</h2>
              <p className="text-xs text-muted-foreground mt-0.5">강사별 강의 KPI를 확인하세요</p>
            </div>
            {currentCohort && (
              <Badge
                variant={currentCohort.status === "active" ? "default" : currentCohort.status === "closed" ? "secondary" : "outline"}
                className="text-[10px] h-5"
              >
                {statusLabel}
              </Badge>
            )}
          </div>

          {/* Error state */}
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
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <KPICard
                  title="매출"
                  value={formatKRW(currentKpi.revenue)}
                  deltaPct={currentKpi.revenue_delta_pct}
                  icon={<DollarSign className="h-4 w-4" />}
                  sparklineData={sparklines.revenue}
                  onClick={() => setSheetMetric("revenue")}
                />
                <KPICard
                  title="수강생"
                  value={`${currentKpi.students}명`}
                  deltaPct={currentKpi.students_delta_pct}
                  icon={<Users className="h-4 w-4" />}
                  sparklineData={sparklines.students}
                  onClick={() => setSheetMetric("students")}
                />
                <KPICard
                  title="리드"
                  value={`${currentKpi.leads}명`}
                  deltaPct={currentKpi.leads_delta_pct}
                  icon={<Layers className="h-4 w-4" />}
                  sparklineData={sparklines.leads}
                  onClick={() => setSheetMetric("leads")}
                />
                <KPICard
                  title="전환율"
                  value={`${currentKpi.leads > 0 ? ((currentKpi.students / currentKpi.leads) * 100).toFixed(1) : "0.0"}%`}
                  deltaPct={currentKpi.leads_delta_pct}
                  icon={<TrendingUp className="h-4 w-4" />}
                  sparklineData={sparklines.conversion}
                  onClick={() => setSheetMetric("conversion")}
                />
              </div>

              {/* Charts row */}
              <div className="grid gap-3 lg:grid-cols-2">
                <CohortTrendChart kpis={kpis} />
                <FunnelTable funnel={funnel} loading={isDetailLoading} />
              </div>

              {/* Bottom row: checklist + recent enrollments */}
              <div className="grid gap-3 lg:grid-cols-2">
                <ChecklistWidget checklist={checklist} loading={isDetailLoading} />
                <RecentEnrollmentsTable enrollments={enrollments} loading={isDetailLoading} />
              </div>
            </>
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
    </Layout>
  );
};

export default Index;
