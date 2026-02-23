import { useState, useMemo } from "react";
import { DollarSign, Users, TrendingUp, Layers } from "lucide-react";
import { Layout } from "@/components/Layout";
import { KPICard } from "@/components/KPICard";
import { CohortTrendChart } from "@/components/CohortTrendChart";
import { FunnelTable } from "@/components/FunnelTable";
import { DashboardFilters } from "@/components/DashboardFilters";
import { KPIDetailSheet } from "@/components/KPIDetailSheet";
import { Badge } from "@/components/ui/badge";
import {
  cohorts,
  getRevenue,
  getStudents,
  getLeadCount,
  getConversionRate,
  getPreviousCohort,
  getDeltaPct,
  getCohortsForInstructorCourse,
  getCoursesForInstructor,
} from "@/data/mockData";

type MetricKey = "revenue" | "students" | "leads" | "conversion";

const Index = () => {
  const [instructorId, setInstructorId] = useState("inst-1");
  const [courseId, setCourseId] = useState("course-1");
  const [cohortId, setCohortId] = useState("coh-3");
  const [sheetMetric, setSheetMetric] = useState<MetricKey | null>(null);

  const handleInstructorChange = (v: string) => {
    setInstructorId(v);
    const courses = getCoursesForInstructor(v);
    if (courses.length > 0) {
      const firstCourse = courses[0].id;
      setCourseId(firstCourse);
      const chs = getCohortsForInstructorCourse(v, firstCourse);
      setCohortId(chs.length > 0 ? chs[chs.length - 1].id : "");
    } else {
      setCourseId("");
      setCohortId("");
    }
  };

  const handleCourseChange = (v: string) => {
    setCourseId(v);
    const chs = getCohortsForInstructorCourse(instructorId, v);
    setCohortId(chs.length > 0 ? chs[chs.length - 1].id : "");
  };

  const currentCohort = cohorts.find((c) => c.id === cohortId);
  const prevCohort = currentCohort ? getPreviousCohort(currentCohort) : null;

  const trendCohorts = useMemo(() => {
    if (!instructorId || !courseId) return [];
    return getCohortsForInstructorCourse(instructorId, courseId);
  }, [instructorId, courseId]);

  const kpis = useMemo(() => {
    if (!currentCohort) return null;
    const revenue = getRevenue(currentCohort.id);
    const students = getStudents(currentCohort.id);
    const leadCount = getLeadCount(currentCohort.id);
    const convRate = getConversionRate(currentCohort.id);

    const prevRevenue = prevCohort ? getRevenue(prevCohort.id) : null;
    const prevStudents = prevCohort ? getStudents(prevCohort.id) : null;
    const prevConvRate = prevCohort ? getConversionRate(prevCohort.id) : null;
    const prevLeads = prevCohort ? getLeadCount(prevCohort.id) : null;

    // Sparkline data: values from all trend cohorts
    const sparkRevenue = trendCohorts.map((c) => getRevenue(c.id));
    const sparkStudents = trendCohorts.map((c) => getStudents(c.id));
    const sparkLeads = trendCohorts.map((c) => getLeadCount(c.id));
    const sparkConv = trendCohorts.map((c) => getConversionRate(c.id));

    return {
      revenue, students, leadCount, convRate,
      deltaRevenue: getDeltaPct(revenue, prevRevenue),
      deltaStudents: getDeltaPct(students, prevStudents),
      deltaConvRate: getDeltaPct(convRate, prevConvRate),
      deltaLeads: getDeltaPct(leadCount, prevLeads),
      sparkRevenue, sparkStudents, sparkLeads, sparkConv,
    };
  }, [currentCohort, prevCohort, trendCohorts]);

  const formatKRW = (v: number) => `₩${(v / 10000).toLocaleString()}만`;

  const statusLabel = currentCohort?.status === "active" ? "운영중" : currentCohort?.status === "closed" ? "종료" : "계획";

  return (
    <Layout>
      <div className="space-y-0">
        {/* Sticky Filters */}
        <DashboardFilters
          instructorId={instructorId}
          courseId={courseId}
          cohortId={cohortId}
          onInstructorChange={handleInstructorChange}
          onCourseChange={handleCourseChange}
          onCohortChange={setCohortId}
        />

        <div className="space-y-6 pt-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">대시보드</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                강사별 강의 KPI를 확인하세요
              </p>
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

          {/* KPI Cards */}
          {kpis ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <KPICard
                  title="매출"
                  value={formatKRW(kpis.revenue)}
                  deltaPct={kpis.deltaRevenue}
                  icon={<DollarSign className="h-4 w-4" />}
                  sparklineData={kpis.sparkRevenue}
                  onClick={() => setSheetMetric("revenue")}
                />
                <KPICard
                  title="수강생"
                  value={`${kpis.students}명`}
                  deltaPct={kpis.deltaStudents}
                  icon={<Users className="h-4 w-4" />}
                  sparklineData={kpis.sparkStudents}
                  onClick={() => setSheetMetric("students")}
                />
                <KPICard
                  title="리드"
                  value={`${kpis.leadCount}명`}
                  deltaPct={kpis.deltaLeads}
                  icon={<Layers className="h-4 w-4" />}
                  sparklineData={kpis.sparkLeads}
                  onClick={() => setSheetMetric("leads")}
                />
                <KPICard
                  title="전환율"
                  value={`${kpis.convRate.toFixed(1)}%`}
                  deltaPct={kpis.deltaConvRate}
                  icon={<TrendingUp className="h-4 w-4" />}
                  sparklineData={kpis.sparkConv}
                  onClick={() => setSheetMetric("conversion")}
                />
              </div>

              {/* Charts */}
              <div className="grid gap-3 lg:grid-cols-2">
                <CohortTrendChart cohorts={trendCohorts} />
                <FunnelTable cohortId={cohortId} />
              </div>
            </>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-card">
              <p className="text-sm text-muted-foreground">강사와 강의를 선택해주세요</p>
            </div>
          )}
        </div>
      </div>

      {/* KPI Detail Drawer */}
      <KPIDetailSheet
        open={!!sheetMetric}
        onOpenChange={(o) => !o && setSheetMetric(null)}
        metric={sheetMetric}
        cohorts={trendCohorts}
      />
    </Layout>
  );
};

export default Index;
