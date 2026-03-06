import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

interface KPICardProps {
  title: string;
  value: string;
  deltaPct: number | null;
  deltaLabel?: string;
  icon: React.ReactNode;
  sparklineData?: number[];
  secondaryText?: string;
  progress?: number | null; // 0~1
  onClick?: () => void;
}

export function KPICard({ title, value, deltaPct, deltaLabel = "vs 전기수", icon, sparklineData, secondaryText, progress, onClick }: KPICardProps) {
  const deltaDisplay =
    deltaPct === null
      ? { text: "—", color: "text-kpi-neutral", bg: "bg-kpi-neutral-bg", Icon: Minus }
      : deltaPct >= 0
      ? { text: `+${deltaPct.toFixed(1)}%`, color: "text-kpi-positive", bg: "bg-kpi-positive-bg", Icon: TrendingUp }
      : { text: `${deltaPct.toFixed(1)}%`, color: "text-kpi-negative", bg: "bg-kpi-negative-bg", Icon: TrendingDown };

  const sparkData = sparklineData?.map((v, i) => ({ v, i })) ?? [];
  const sparkColor = "hsl(var(--primary))";

  return (
    <Card
      className={`group relative overflow-hidden h-full transition-colors duration-150 ease-out hover:border-border/80 hover:shadow-[0_1px_3px_0_hsl(var(--foreground)/0.04)] ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4 h-full flex flex-col justify-between">
        {/* Top: title + icon */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider leading-none">{title}</p>
            <p className="text-lg font-semibold tracking-tight text-foreground tabular-nums leading-tight break-all">{value}</p>
            <div className="flex items-center gap-1.5 pt-0.5 min-h-[20px]">
              <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${deltaDisplay.bg} ${deltaDisplay.color}`}>
                <deltaDisplay.Icon className="h-2.5 w-2.5" />
                {deltaDisplay.text}
              </span>
              <span className="text-[10px] text-muted-foreground">{deltaLabel}</span>
            </div>
            <div className="min-h-[16px]">
              {secondaryText ? (
                <p className="text-[10px] text-muted-foreground truncate">{secondaryText}</p>
              ) : null}
            </div>
          </div>
          <div className="rounded-md bg-muted h-8 w-8 flex items-center justify-center text-muted-foreground shrink-0">
            {icon}
          </div>
        </div>
        {/* Progress bar (target) */}
        <div className="min-h-[10px]">
          {progress != null ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(progress * 100, 100)}%` }}
                />
              </div>
              <span className="text-[9px] tabular-nums text-muted-foreground whitespace-nowrap">
                {(progress * 100).toFixed(0)}%
              </span>
            </div>
          ) : null}
        </div>
        {/* Sparkline – fixed height always rendered */}
        <div className="mt-1.5 h-10 w-full opacity-60 group-hover:opacity-80 transition-opacity duration-150">
          {sparkData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 1, right: 0, left: 0, bottom: 1 }}>
                <defs>
                  <linearGradient id={`spark-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparkColor} stopOpacity={0.12} />
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
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
