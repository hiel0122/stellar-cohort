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
import { Cohort, getRevenue, getStudents, getConversionRate } from "@/data/mockData";

interface Props {
  cohorts: Cohort[];
}

export function CohortTrendChart({ cohorts }: Props) {
  const data = cohorts.map((c) => ({
    name: `${c.cohort_no}기`,
    revenue: getRevenue(c.id),
    students: getStudents(c.id),
    conversion: parseFloat(getConversionRate(c.id).toFixed(1)),
  }));

  const formatKRW = (v: number) => `${(v / 10000).toLocaleString()}만`;

  const tooltipStyle = {
    borderRadius: '6px',
    border: '1px solid hsl(var(--border))',
    fontSize: '12px',
    boxShadow: '0 4px 12px hsl(0 0% 0% / 0.08)',
    backgroundColor: 'hsl(var(--card))',
    color: 'hsl(var(--card-foreground))',
  };

  return (
    <Card className="border">
      <CardHeader className="pb-1 px-4 pt-4">
        <CardTitle className="text-sm font-semibold">기수별 추이</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="mb-3 h-7 p-0.5 bg-muted/50">
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
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatKRW} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [`₩${value.toLocaleString()}`, "매출"]}
                    contentStyle={tooltipStyle}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revenueGrad)" dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }} />
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
                      <stop offset="0%" stopColor="hsl(var(--kpi-positive))" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(var(--kpi-positive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="students" stroke="hsl(var(--kpi-positive))" strokeWidth={2} fill="url(#studentsGrad)" dot={{ fill: 'hsl(var(--kpi-positive))', r: 3, strokeWidth: 0 }} name="수강생" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="conversion">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} unit="%" axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "전환율"]}
                    contentStyle={tooltipStyle}
                  />
                  <Line type="monotone" dataKey="conversion" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }} name="전환율" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
