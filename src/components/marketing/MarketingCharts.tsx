import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { MarketingLink, ClickEvent } from "@/lib/marketing/types";

interface Props {
  links: MarketingLink[];
  events: ClickEvent[];
}

/* ── Custom Tooltip ── */
function ChartTooltipCard({ active, payload, labelKey, valueKey }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border/60 bg-popover px-3 py-2 shadow-sm">
      <p className="text-xs font-medium text-foreground truncate max-w-[200px]">
        {d[labelKey]}
      </p>
      <p className="text-[11px] text-muted-foreground mt-0.5">
        클릭 <span className="font-semibold tabular-nums text-foreground">{d[valueKey]?.toLocaleString()}</span>
      </p>
    </div>
  );
}

/* ── Truncated Y-axis tick with hover tooltip ── */
function TruncatedTick({ x, y, payload, maxLen = 14 }: any) {
  const full: string = payload.value ?? "";
  const display = full.length > maxLen ? full.slice(0, maxLen) + "…" : full;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <text
            x={x}
            y={y}
            textAnchor="end"
            dominantBaseline="central"
            className="fill-muted-foreground text-[11px] cursor-default"
          >
            {display}
          </text>
        </TooltipTrigger>
        {full.length > maxLen && (
          <TooltipContent side="left" className="text-xs max-w-[240px] break-all">
            {full}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

/* ── Bar label at end ── */
function BarEndLabel({ x, y, width, value }: any) {
  return (
    <text
      x={x + width + 6}
      y={y}
      dominantBaseline="central"
      className="fill-muted-foreground text-[10px] tabular-nums"
    >
      {value?.toLocaleString()}
    </text>
  );
}

export function MarketingCharts({ links, events }: Props) {
  const [timeRange, setTimeRange] = useState<7 | 30>(7);

  const topLinks = useMemo(() => {
    return [...links]
      .sort((a, b) => b.total_clicks - a.total_clicks)
      .slice(0, 10)
      .map((l) => ({ name: l.alias, clicks: l.total_clicks }));
  }, [links]);

  const byChannel = useMemo(() => {
    const map: Record<string, number> = {};
    links.forEach((l) => {
      map[l.channel] = (map[l.channel] || 0) + l.total_clicks;
    });
    return Object.entries(map).map(([channel, clicks]) => ({ channel, clicks }));
  }, [links]);

  const overTime = useMemo(() => {
    const now = new Date();
    const days: Record<string, number> = {};
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      days[key] = 0;
    }
    events.forEach((e) => {
      const d = new Date(e.timestamp);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([date, clicks]) => ({ date, clicks }));
  }, [events, timeRange]);

  if (links.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Top 10 horizontal bar */}
      <Card className="border-border/70 shadow-none">
        <CardHeader className="pb-1 px-5 pt-4">
          <CardTitle className="text-sm font-medium text-foreground">링크별 클릭 TOP 10</CardTitle>
        </CardHeader>
        <CardContent className="h-72 px-5 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topLinks}
              layout="vertical"
              margin={{ left: 4, right: 40, top: 4, bottom: 4 }}
              barCategoryGap="28%"
            >
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={110}
                axisLine={false}
                tickLine={false}
                tick={<TruncatedTick maxLen={14} />}
              />
              <RechartsTooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                content={<ChartTooltipCard labelKey="name" valueKey="clicks" />}
              />
              <Bar
                dataKey="clicks"
                fill="hsl(var(--primary))"
                radius={[0, 6, 6, 0]}
                maxBarSize={18}
                label={<BarEndLabel />}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* By channel vertical bar */}
      <Card className="border-border/70 shadow-none">
        <CardHeader className="pb-1 px-5 pt-4">
          <CardTitle className="text-sm font-medium text-foreground">채널별 클릭</CardTitle>
        </CardHeader>
        <CardContent className="h-72 px-5 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byChannel} margin={{ left: 0, right: 8, top: 8, bottom: 4 }} barCategoryGap="35%">
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.35} />
              <XAxis
                dataKey="channel"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <RechartsTooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                content={<ChartTooltipCard labelKey="channel" valueKey="clicks" />}
              />
              <Bar
                dataKey="clicks"
                fill="hsl(var(--primary))"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Over time line */}
      <Card className="lg:col-span-2 border-border/70 shadow-none">
        <CardHeader className="pb-1 px-5 pt-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">시간별 클릭 추이</CardTitle>
          <div className="flex rounded-full border border-border bg-muted/50 p-0.5">
            {([7, 30] as const).map((d) => (
              <button
                key={d}
                onClick={() => setTimeRange(d)}
                className={`px-3 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                  timeRange === d
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {d}일
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="h-56 px-5 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overTime} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.3} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <RechartsTooltip
                content={<ChartTooltipCard labelKey="date" valueKey="clicks" />}
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
