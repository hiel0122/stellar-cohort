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
import type { CohortKpi } from "@/lib/types";
import { formatWonCompact, formatWonFull, formatInt } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric: "revenue" | "students" | "leads" | "conversion" | null;
  kpis: CohortKpi[];
}

const tooltipStyle: React.CSSProperties = {
  borderRadius: '6px',
  border: '1px solid hsl(var(--border))',
  fontSize: '12px',
  boxShadow: '0 2px 8px hsl(var(--foreground) / 0.06)',
  backgroundColor: 'hsl(var(--popover))',
  color: 'hsl(var(--popover-foreground))',
};

const metricConfig = {
  revenue: {
    title: "매출 상세",
    desc: "기수별 매출 추이",
    getValue: (k: CohortKpi) => k.revenue,
    formatCompact: (v: number) => formatWonCompact(v),
    formatFull: (v: number) => formatWonFull(v),
  },
  students: {
    title: "수강생 상세",
    desc: "기수별 유료 수강생 수",
    getValue: (k: CohortKpi) => k.students,
    formatCompact: (v: number) => `${formatInt(v)}명`,
    formatFull: (v: number) => `${formatInt(v)}명`,
  },
  leads: {
    title: "리드 상세",
    desc: "기수별 리드(문의) 수",
    getValue: (k: CohortKpi) => k.leads,
    formatCompact: (v: number) => `${formatInt(v)}명`,
    formatFull: (v: number) => `${formatInt(v)}명`,
  },
  conversion: {
    title: "전환율 상세",
    desc: "기수별 전환율 추이 (수강생/지원자)",
    getValue: (k: CohortKpi) => k.conversion,
    formatCompact: (v: number) => `${v.toFixed(1)}%`,
    formatFull: (v: number) => `${v.toFixed(1)}%`,
  },
};

export function KPIDetailSheet({ open, onOpenChange, metric, kpis }: Props) {
  if (!metric) return null;
  const config = metricConfig[metric];
  const data = (kpis ?? []).map((k) => ({
    name: `${k.cohort_no}기`,
    value: config.getValue(k),
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
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value: number) => [config.formatFull(value), config.title]} contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#detailGrad)" dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div>
          <div className="grid grid-cols-2 border-b py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>기수</span>
            <span className="text-right">값</span>
          </div>
          {data.map((d) => (
            <div key={d.name} className="grid grid-cols-2 border-b border-border/50 py-2.5 text-sm hover:bg-muted/30 transition-colors">
              <span className="text-muted-foreground">{d.name}</span>
              <span className="text-right font-medium tabular-nums text-foreground">{config.formatCompact(d.value)}</span>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
