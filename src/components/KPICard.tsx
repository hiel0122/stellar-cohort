import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

interface KPICardProps {
  title: string;
  value: string;
  deltaPct: number | null;
  icon: React.ReactNode;
  sparklineData?: number[];
  onClick?: () => void;
}

export function KPICard({ title, value, deltaPct, icon, sparklineData, onClick }: KPICardProps) {
  const deltaDisplay =
    deltaPct === null
      ? { text: "N/A", color: "text-kpi-neutral", bg: "bg-kpi-neutral-bg", Icon: Minus }
      : deltaPct >= 0
      ? { text: `+${deltaPct.toFixed(1)}%`, color: "text-kpi-positive", bg: "bg-kpi-positive-bg", Icon: TrendingUp }
      : { text: `${deltaPct.toFixed(1)}%`, color: "text-kpi-negative", bg: "bg-kpi-negative-bg", Icon: TrendingDown };

  const sparkData = sparklineData?.map((v, i) => ({ v, i })) ?? [];
  const sparkColor = deltaPct === null ? "hsl(var(--kpi-neutral))" : deltaPct >= 0 ? "hsl(var(--kpi-positive))" : "hsl(var(--kpi-negative))";

  return (
    <Card
      className={`group relative overflow-hidden border transition-all duration-200 hover:shadow-md hover:border-primary/20 ${onClick ? "cursor-pointer hover:-translate-y-0.5" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold tracking-tight text-card-foreground">{value}</p>
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${deltaDisplay.bg} ${deltaDisplay.color}`}>
                <deltaDisplay.Icon className="h-2.5 w-2.5" />
                {deltaDisplay.text}
              </span>
              <span className="text-[10px] text-muted-foreground">vs 전기수</span>
            </div>
          </div>
          <div className="rounded-md bg-primary/8 p-2 text-primary">
            {icon}
          </div>
        </div>
        {/* Sparkline */}
        {sparkData.length > 1 && (
          <div className="mt-3 h-8 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`spark-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparkColor} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={sparkColor}
                  strokeWidth={1.5}
                  fill={`url(#spark-${title})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
