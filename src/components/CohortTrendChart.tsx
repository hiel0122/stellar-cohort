import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { CohortKpi } from "@/lib/types";

interface Props {
  kpis: CohortKpi[];
  loading?: boolean;
}

const tooltipStyle: React.CSSProperties = {
  borderRadius: '6px',
  border: '1px solid hsl(var(--border))',
  fontSize: '12px',
  boxShadow: '0 2px 8px hsl(var(--foreground) / 0.06)',
  backgroundColor: 'hsl(var(--popover))',
  color: 'hsl(var(--popover-foreground))',
};

const formatKRW = (v: number) => `${(v / 10000).toLocaleString()}만`;
const axisTickProps = { fill: 'hsl(var(--muted-foreground))', fontSize: 11 };

export function CohortTrendChart({ kpis, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-1 px-4 pt-4"><Skeleton className="h-4 w-24" /></CardHeader>
        <CardContent className="px-4 pb-4"><Skeleton className="h-56 w-full" /></CardContent>
      </Card>
    );
  }

  const data = kpis.map((k) => ({
    name: `${k.cohort_no}기`,
    revenue: k.revenue,
    students: k.students,
    conversion: k.leads > 0 ? parseFloat(((k.students / k.leads) * 100).toFixed(1)) : 0,
  }));

  return (
    <Card>
      <CardHeader className="pb-1 px-4 pt-4">
        <CardTitle className="text-sm font-semibold">기수별 추이</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="mb-3 h-7 p-0.5 bg-muted">
            <TabsTrigger value="revenue" className="text-xs h-6 px-3">매출</TabsTrigger>
            <TabsTrigger value="students" className="text-xs h-6 px-3">수강생</TabsTrigger>
            <TabsTrigger value="conversion" className="text-xs h-6 px-3">전환율</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={axisTickProps} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatKRW} tick={axisTickProps} axisLine={false} tickLine={false} width={52} />
                  <Tooltip formatter={(value: number) => [`₩${value.toLocaleString()}`, "매출"]} contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#revenueGrad)" dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="students">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="studentsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={axisTickProps} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTickProps} axisLine={false} tickLine={false} width={32} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="students" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#studentsGrad)" dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }} name="수강생" />
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
                  <Tooltip formatter={(value: number) => [`${value}%`, "전환율"]} contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="conversion" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }} name="전환율" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
