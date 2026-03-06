import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, LineChart, Line, ReferenceDot,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { CohortKpi } from "@/lib/types";
import { formatNumberFull, formatWonFull } from "@/lib/format";

interface Props {
  kpis: CohortKpi[];
  loading?: boolean;
  baselineKpi?: CohortKpi | null;
  isComparing?: boolean;
  netProfitSeries?: (number | null)[];
}

const tooltipStyle: React.CSSProperties = {
  borderRadius: '6px', border: '1px solid hsl(var(--border))', fontSize: '12px',
  boxShadow: '0 2px 8px hsl(var(--foreground) / 0.06)',
  backgroundColor: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))',
};
const axisTickProps = { fill: 'hsl(var(--muted-foreground))', fontSize: 11 };

export function CohortTrendChart({ kpis, loading, baselineKpi, isComparing, netProfitSeries }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-1 px-4 pt-4"><Skeleton className="h-4 w-24" /></CardHeader>
        <CardContent className="px-4 pb-4"><Skeleton className="h-56 w-full" /></CardContent>
      </Card>
    );
  }

  const data = (kpis ?? []).map((k, i) => ({
    name: `${k.cohort_no}기`,
    revenue: k.revenue,
    students: k.students,
    conversion: k.conversion,
    netProfit: netProfitSeries?.[i] ?? null,
  }));

  const baselineIdx = isComparing && baselineKpi
    ? data.findIndex((d) => d.name === `${baselineKpi.cohort_no}기`) : -1;

  const hasNetProfit = netProfitSeries?.some((v) => v !== null && v !== 0);

  return (
    <Card>
      <CardHeader className="pb-1 px-4 pt-4"><CardTitle className="text-sm font-semibold">기수별 추이</CardTitle></CardHeader>
      <CardContent className="px-4 pb-4">
        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="mb-3 h-7 p-0.5 bg-muted">
            <TabsTrigger value="revenue" className="text-xs h-6 px-3">매출</TabsTrigger>
            <TabsTrigger value="students" className="text-xs h-6 px-3">수강생</TabsTrigger>
            <TabsTrigger value="conversion" className="text-xs h-6 px-3">전환율</TabsTrigger>
            <TabsTrigger value="netprofit" className="text-xs h-6 px-3">순이익</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs><linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.12} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={axisTickProps} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v: number) => formatWonCompact(v)} tick={axisTickProps} axisLine={false} tickLine={false} width={52} />
                  <Tooltip formatter={(value: number, name: string) => { if (name === "baseRevenue") return [formatWonFull(value), "기준 매출"]; return [formatWonFull(value), "매출"]; }} contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#revenueGrad)" dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }} />
                  {isComparing && baselineIdx >= 0 && <ReferenceDot x={data[baselineIdx]?.name} y={data[baselineIdx]?.revenue} r={5} fill="hsl(var(--muted-foreground))" stroke="hsl(var(--background))" strokeWidth={2} />}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="students">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs><linearGradient id="studentsGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.12} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={axisTickProps} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTickProps} axisLine={false} tickLine={false} width={32} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="students" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#studentsGrad)" dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }} name="수강생" />
                  {isComparing && baselineIdx >= 0 && <ReferenceDot x={data[baselineIdx]?.name} y={data[baselineIdx]?.students} r={5} fill="hsl(var(--muted-foreground))" stroke="hsl(var(--background))" strokeWidth={2} />}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="conversion">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={axisTickProps} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTickProps} unit="%" axisLine={false} tickLine={false} width={36} />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, "전환율"]} contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="conversion" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }} name="전환율" />
                  {isComparing && baselineIdx >= 0 && <ReferenceDot x={data[baselineIdx]?.name} y={data[baselineIdx]?.conversion} r={5} fill="hsl(var(--muted-foreground))" stroke="hsl(var(--background))" strokeWidth={2} />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="netprofit">
            <div className="h-56">
              {hasNetProfit ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs><linearGradient id="netProfitGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.12} /><stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={axisTickProps} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v: number) => formatWonCompact(v)} tick={axisTickProps} axisLine={false} tickLine={false} width={52} />
                    <Tooltip
                      formatter={(value: number | null, name: string) => {
                        if (value === null) return ["비용 미입력", "순이익"];
                        return [formatWonFull(value), "순이익 (L1)"];
                      }}
                      contentStyle={tooltipStyle}
                    />
                    <Area type="monotone" dataKey="netProfit" stroke="hsl(var(--chart-2))" strokeWidth={1.5} fill="url(#netProfitGrad)"
                      dot={{ fill: 'hsl(var(--chart-2))', r: 3, strokeWidth: 0 }} connectNulls={false} />
                    {isComparing && baselineIdx >= 0 && data[baselineIdx]?.netProfit != null && (
                      <ReferenceDot x={data[baselineIdx]?.name} y={data[baselineIdx]?.netProfit!} r={5}
                        fill="hsl(var(--muted-foreground))" stroke="hsl(var(--background))" strokeWidth={2} />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-xs text-muted-foreground">비용 데이터를 입력하면 순이익 추이가 표시됩니다</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
