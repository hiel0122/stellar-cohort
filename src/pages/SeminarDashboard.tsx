import { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { SectionCard } from "@/components/seminar/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useScreeningStore } from "@/lib/screening/store";
import { CATEGORY_LABEL, STATUS_LABEL, type ApplicantCategory, type ProjectStatus } from "@/lib/screening/types";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Users, Trophy, ClipboardCheck, Clock3, Target, Sparkles } from "lucide-react";

const STATUS_VARIANT: Record<ProjectStatus, string> = {
  preparing: "bg-muted text-muted-foreground",
  screening: "bg-primary/10 text-primary border-primary/20",
  confirmed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  sending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  closed: "bg-muted text-muted-foreground",
};

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--muted-foreground))", "hsl(var(--accent-foreground))", "hsl(var(--destructive))", "hsl(var(--ring))"];

export default function SeminarDashboardPage() {
  const { projects, activeProjectId, setActiveProjectId } = useScreeningStore();
  const active = projects.find((p) => p.id === activeProjectId) ?? projects[0];

  const completed = useMemo(
    () => active?.applicants.filter((a) => a.status === "screened" || a.status === "confirmed") ?? [],
    [active]
  );

  const kpis = useMemo(() => {
    const cnt = (c: ApplicantCategory) => completed.filter((a) => a.category === c).length;
    const avg = completed.length === 0 ? 0 : completed.reduce((s, a) => s + a.totalScore, 0) / completed.length;
    return {
      total: completed.length,
      priority: cnt("priority"),
      selected: cnt("selected"),
      reserve: cnt("reserve"),
      confirmed: completed.filter((a) => a.status === "confirmed").length,
      avgScore: Math.round(avg),
    };
  }, [completed]);

  const ageData = useMemo(() => groupBy(completed, "ageGroup"), [completed]);
  const revenueData = useMemo(() => groupBy(completed, "revenueBand"), [completed]);
  const budgetData = useMemo(() => groupBy(completed, "budgetBand"), [completed]);
  const categoryData = useMemo(
    () =>
      (["priority", "selected", "reserve", "excluded"] as ApplicantCategory[]).map((c) => ({
        name: CATEGORY_LABEL[c],
        value: completed.filter((a) => a.category === c).length,
      })),
    [completed]
  );

  const top10 = [...completed].sort((a, b) => b.totalScore - a.totalScore).slice(0, 10);

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">심사 대시보드</h1>
          <p className="text-sm text-muted-foreground">심사가 완료된 데이터를 기준으로 집계됩니다.</p>
        </header>

        {/* Filter bar */}
        <SectionCard bodyClassName="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">프로젝트</span>
            <Select value={active?.id} onValueChange={setActiveProjectId}>
              <SelectTrigger className="w-64 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {active && (
            <>
              <Badge variant="outline" className="font-mono text-[11px]">버전 {active.criteriaVersion}</Badge>
              <Badge className={STATUS_VARIANT[active.status]}>{STATUS_LABEL[active.status]}</Badge>
              <Badge variant="secondary" className="ml-auto text-[11px]">데이터 기준: 심사완료 {kpis.total}건</Badge>
            </>
          )}
        </SectionCard>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard icon={<Users className="h-4 w-4" />} label="총 지원자" value={kpis.total} />
          <KpiCard icon={<Sparkles className="h-4 w-4" />} label="우선선발" value={kpis.priority} accent />
          <KpiCard icon={<ClipboardCheck className="h-4 w-4" />} label="선발" value={kpis.selected} />
          <KpiCard icon={<Clock3 className="h-4 w-4" />} label="예비선발" value={kpis.reserve} />
          <KpiCard icon={<Target className="h-4 w-4" />} label="확정" value={kpis.confirmed} />
          <KpiCard icon={<Trophy className="h-4 w-4" />} label="평균 점수" value={kpis.avgScore} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <SectionCard title="연령대 분포">
            <ChartBar data={ageData} />
          </SectionCard>
          <SectionCard title="매출 구간 분포">
            <ChartBar data={revenueData} />
          </SectionCard>
          <SectionCard title="예산 구간 분포">
            <ChartBar data={budgetData} />
          </SectionCard>
          <SectionCard title="분류별 인원 비율">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <SectionCard title="상위 점수 TOP 10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>브랜드</TableHead>
                  <TableHead className="text-right">총점</TableHead>
                  <TableHead>분류</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top10.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-8">심사완료 데이터가 없습니다.</TableCell></TableRow>
                )}
                {top10.map((a, i) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>{a.name}</TableCell>
                    <TableCell className="text-muted-foreground">{a.brand}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{a.totalScore}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{CATEGORY_LABEL[a.category]}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
          <SectionCard title="최근 확정 스냅샷">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>스냅샷</TableHead>
                  <TableHead>생성일시</TableHead>
                  <TableHead className="text-right">건수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(active?.snapshots ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground text-sm py-8">생성된 스냅샷이 없습니다.</TableCell></TableRow>
                )}
                {active?.snapshots.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.label}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{s.createdAt}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </div>
      </div>
    </Layout>
  );
}

function KpiCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${accent ? "border-primary/30" : ""}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}<span>{label}</span></div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${accent ? "text-primary" : ""}`}>{value.toLocaleString()}</div>
    </div>
  );
}

function ChartBar({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
          <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function groupBy<T extends Record<string, any>>(items: T[], key: keyof T): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const it of items) {
    const k = String(it[key] ?? "-");
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}
