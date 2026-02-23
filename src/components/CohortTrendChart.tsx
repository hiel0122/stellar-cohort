import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">기수별 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="revenue">매출</TabsTrigger>
            <TabsTrigger value="students">수강생</TabsTrigger>
            <TabsTrigger value="conversion">전환율</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(220, 10%, 46%)' }} />
                  <YAxis tickFormatter={formatKRW} className="text-xs" tick={{ fill: 'hsl(220, 10%, 46%)' }} />
                  <Tooltip
                    formatter={(value: number) => [`₩${value.toLocaleString()}`, "매출"]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220, 13%, 90%)', fontSize: '13px' }}
                  />
                  <Bar dataKey="revenue" fill="hsl(224, 65%, 48%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="students">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(220, 10%, 46%)' }} />
                  <YAxis tick={{ fill: 'hsl(220, 10%, 46%)' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220, 13%, 90%)', fontSize: '13px' }} />
                  <Bar dataKey="students" fill="hsl(160, 60%, 40%)" radius={[4, 4, 0, 0]} name="수강생" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="conversion">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(220, 10%, 46%)' }} />
                  <YAxis tick={{ fill: 'hsl(220, 10%, 46%)' }} unit="%" />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "전환율"]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220, 13%, 90%)', fontSize: '13px' }}
                  />
                  <Line type="monotone" dataKey="conversion" stroke="hsl(224, 65%, 48%)" strokeWidth={2} dot={{ fill: 'hsl(224, 65%, 48%)', r: 4 }} name="전환율" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
