import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import type { MarketingLink, ClickEvent } from "@/lib/marketing/types";

interface Props {
  links: MarketingLink[];
  events: ClickEvent[];
}

export function MarketingCharts({ links, events }: Props) {
  const [timeRange, setTimeRange] = useState<7 | 30>(7);

  // Top 10 links by clicks
  const topLinks = useMemo(() => {
    return [...links]
      .sort((a, b) => b.total_clicks - a.total_clicks)
      .slice(0, 10)
      .map((l) => ({ name: l.alias.length > 12 ? l.alias.slice(0, 12) + "…" : l.alias, clicks: l.total_clicks }));
  }, [links]);

  // Clicks by channel
  const byChannel = useMemo(() => {
    const map: Record<string, number> = {};
    links.forEach((l) => {
      map[l.channel] = (map[l.channel] || 0) + l.total_clicks;
    });
    return Object.entries(map).map(([channel, clicks]) => ({ channel, clicks }));
  }, [links]);

  // Clicks over time
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
      {/* Top 10 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">링크별 클릭 TOP 10</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topLinks} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* By channel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">채널별 클릭</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byChannel}>
              <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="clicks" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Over time */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">시간별 클릭 추이</CardTitle>
          <div className="flex gap-1">
            <Button variant={timeRange === 7 ? "default" : "outline"} size="sm" className="h-6 text-[10px] px-2" onClick={() => setTimeRange(7)}>
              7일
            </Button>
            <Button variant={timeRange === 30 ? "default" : "outline"} size="sm" className="h-6 text-[10px] px-2" onClick={() => setTimeRange(30)}>
              30일
            </Button>
          </div>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
