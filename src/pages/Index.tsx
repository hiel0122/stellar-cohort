import { useState, useMemo } from "react";
import { DollarSign, Users, TrendingUp, Layers } from "lucide-react";
import { Layout } from "@/components/Layout";
import { KPICard } from "@/components/KPICard";
import { CohortTrendChart } from "@/components/CohortTrendChart";
import { FunnelTable } from "@/components/FunnelTable";
import { DashboardFilters } from "@/components/DashboardFilters";
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

const Index = () => {
  const [instructorId, setInstructorId] = useState("inst-1");
  const [courseId, setCourseId] = useState("course-1");
  const [cohortId, setCohortId] = useState("coh-3");

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

    return {
      revenue,
      students,
      leadCount,
      convRate,
      deltaRevenue: getDeltaPct(revenue, prevRevenue),
      deltaStudents: getDeltaPct(students, prevStudents),
      deltaConvRate: getDeltaPct(convRate, prevConvRate),
      deltaLeads: getDeltaPct(leadCount, prevLeads),
    };
  }, [currentCohort, prevCohort]);

  const trendCohorts = useMemo(() => {
    if (!instructorId || !courseId) return [];
    return getCohortsForInstructorCourse(instructorId, courseId);
  }, [instructorId, courseId]);

  const formatKRW = (v: number) => `₩${(v / 10000).toLocaleString()}만`;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">대시보드</h2>
            <p className="text-sm text-muted-foreground">
              강사별 강의 KPI를 확인하세요
            </p>
          </div>
          {currentCohort && (
            <Badge
              variant={
                currentCohort.status === "active"
                  ? "default"
                  : currentCohort.status === "closed"
                  ? "secondary"
                  : "outline"
              }
            >
              {currentCohort.status === "active" ? "운영중" : currentCohort.status === "closed" ? "종료" : "계획"}
            </Badge>
          )}
        </div>

        {/* Filters */}
        <DashboardFilters
          instructorId={instructorId}
          courseId={courseId}
          cohortId={cohortId}
          onInstructorChange={handleInstructorChange}
          onCourseChange={handleCourseChange}
          onCohortChange={setCohortId}
        />

        {/* KPI Cards */}
        {kpis ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="매출 (Revenue)"
                value={formatKRW(kpis.revenue)}
                deltaPct={kpis.deltaRevenue}
                icon={<DollarSign className="h-5 w-5" />}
              />
              <KPICard
                title="수강생 (Students)"
                value={`${kpis.students}명`}
                deltaPct={kpis.deltaStudents}
                icon={<Users className="h-5 w-5" />}
              />
              <KPICard
                title="리드 (Leads)"
                value={`${kpis.leadCount}명`}
                deltaPct={kpis.deltaLeads}
                icon={<Layers className="h-5 w-5" />}
              />
              <KPICard
                title="전환율 (CVR)"
                value={`${kpis.convRate.toFixed(1)}%`}
                deltaPct={kpis.deltaConvRate}
                icon={<TrendingUp className="h-5 w-5" />}
              />
            </div>

            {/* Charts */}
            <div className="grid gap-4 lg:grid-cols-2">
              <CohortTrendChart cohorts={trendCohorts} />
              <FunnelTable cohortId={cohortId} />
            </div>
          </>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-card">
            <p className="text-muted-foreground">강사와 강의를 선택해주세요</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Index;
