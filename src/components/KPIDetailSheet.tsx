import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Cohort, getRevenue, getStudents, getConversionRate, getLeadCount } from "@/data/mockData";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: "revenue" | "students" | "leads" | "conversion" | null;
  cohorts: Cohort[];
}

const metricConfig = {
  revenue: {
    title: "매출 상세",
    desc: "기수별 매출 추이 (환불 차감 후)",
    getter: (id: string) => getRevenue(id),
    format: (v: number) => `₩${(v / 10000).toLocaleString()}만`,
    color: "hsl(var(--primary))",
  },
  students: {
    title: "수강생 상세",
    desc: "기수별 유료 수강생 수",
    getter: (id: string) => getStudents(id),
    format: (v: number) => `${v}명`,
    color: "hsl(var(--kpi-positive))",
  },
  leads: {
    title: "리드 상세",
    desc: "기수별 리드(문의) 수",
    getter: (id: string) => getLeadCount(id),
    format: (v: number) => `${v}명`,
    color: "hsl(var(--chart-4))",
  },
  conversion: {
    title: "전환율 상세",
    desc: "기수별 전환율 추이",
    getter: (id: string) => getConversionRate(id),
    format: (v: number) => `${v.toFixed(1)}%`,
    color: "hsl(var(--chart-3))",
  },
};

export function KPIDetailSheet({ open, onOpenChange, metric, cohorts }: Props) {
  if (!metric) return null;
  const config = metricConfig[metric];
  const data = cohorts.map((c) => ({
    name: `${c.cohort_no}기`,
    value: config.getter(c.id),
  }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base">{config.title}</SheetTitle>
          <SheetDescription className="text-xs">{config.desc}</SheetDescription>
        </SheetHeader>

        <div className="h-48 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="detailGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={config.color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={config.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: number) => [config.format(value), config.title]}
                contentStyle={{ borderRadius: '6px', border: '1px solid hsl(var(--border))', fontSize: '12px', backgroundColor: 'hsl(var(--card))' }}
              />
              <Area type="monotone" dataKey="value" stroke={config.color} strokeWidth={2} fill="url(#detailGrad)" dot={{ fill: config.color, r: 3, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Data table */}
        <div className="space-y-0">
          <div className="grid grid-cols-2 border-b py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>기수</span>
            <span className="text-right">값</span>
          </div>
          {data.map((d) => (
            <div key={d.name} className="grid grid-cols-2 border-b border-border/50 py-2.5 text-sm">
              <span className="text-muted-foreground">{d.name}</span>
              <span className="text-right font-medium text-card-foreground">{config.format(d.value)}</span>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
