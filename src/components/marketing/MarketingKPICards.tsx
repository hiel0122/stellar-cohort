import { useMemo } from "react";
import { Link2, MousePointerClick, Clock, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { MarketingLink, ClickEvent } from "@/lib/marketing/types";

interface Props {
  links: MarketingLink[];
  events: ClickEvent[];
}

export function MarketingKPICards({ links, events }: Props) {
  const stats = useMemo(() => {
    const totalLinks = links.length;
    const totalClicks = links.reduce((s, l) => s + l.total_clicks, 0);
    const now = Date.now();
    const recent24h = events.filter(
      (e) => now - new Date(e.timestamp).getTime() < 86_400_000,
    ).length;
    const topLink = links.length
      ? links.reduce((a, b) => (a.total_clicks >= b.total_clicks ? a : b))
      : null;
    return { totalLinks, totalClicks, recent24h, topLink };
  }, [links, events]);

  const cards = [
    { label: "총 링크 수", value: stats.totalLinks, icon: Link2, color: "text-blue-500" },
    { label: "총 클릭 수", value: stats.totalClicks, icon: MousePointerClick, color: "text-emerald-500" },
    { label: "최근 24h 클릭", value: stats.recent24h, icon: Clock, color: "text-amber-500" },
    {
      label: "TOP 링크",
      value: stats.topLink ? stats.topLink.alias : "—",
      sub: stats.topLink ? `${stats.topLink.total_clicks}회` : undefined,
      icon: Trophy,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`rounded-lg bg-muted p-2.5 ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-lg font-bold truncate">{c.value}</p>
              {c.sub && <p className="text-xs text-muted-foreground">{c.sub}</p>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
