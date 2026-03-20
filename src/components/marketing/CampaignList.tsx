import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import type { MarketingLink, ClickEvent } from "@/lib/marketing/types";

interface CampaignSummary {
  campaign: string;
  links: number;
  totalClicks: number;
  last24hClicks: number;
  lastClickedAt: string | null;
  channels: string[];
}

interface Props {
  links: MarketingLink[];
  events: ClickEvent[];
  onSelectCampaign: (campaign: string) => void;
}

export function CampaignList({ links, events, onSelectCampaign }: Props) {
  const campaigns = useMemo(() => {
    const map = new Map<string, CampaignSummary>();
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    for (const link of links) {
      const key = link.campaign || "(미지정)";
      if (!map.has(key)) {
        map.set(key, {
          campaign: key,
          links: 0,
          totalClicks: 0,
          last24hClicks: 0,
          lastClickedAt: null,
          channels: [],
        });
      }
      const s = map.get(key)!;
      s.links += 1;
      s.totalClicks += link.total_clicks;
      if (link.last_clicked_at) {
        if (!s.lastClickedAt || link.last_clicked_at > s.lastClickedAt) {
          s.lastClickedAt = link.last_clicked_at;
        }
      }
      if (!s.channels.includes(link.channel)) {
        s.channels.push(link.channel);
      }
    }

    // Count 24h clicks from events
    const validEvents = events.filter((e) => !e.deduped);
    for (const evt of validEvents) {
      const link = links.find((l) => l.id === evt.link_id);
      if (!link) continue;
      const key = link.campaign || "(미지정)";
      const s = map.get(key);
      if (s && now - new Date(evt.timestamp).getTime() < day) {
        s.last24hClicks += 1;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalClicks - a.totalClicks);
  }, [links, events]);

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        아직 캠페인이 없습니다. 링크를 생성하면 캠페인이 자동으로 표시됩니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {campaigns.map((c) => (
        <Card
          key={c.campaign}
          className="cursor-pointer border-border/70 shadow-none hover:border-primary/40 hover:shadow-sm transition-all"
          onClick={() => onSelectCampaign(c.campaign)}
        >
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="truncate">{c.campaign}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold tabular-nums">{c.totalClicks.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">총 클릭</p>
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{c.links}</p>
                <p className="text-[10px] text-muted-foreground">링크 수</p>
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums">{c.last24hClicks}</p>
                <p className="text-[10px] text-muted-foreground">24h 클릭</p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {c.channels.map((ch) => (
                <Badge key={ch} variant="secondary" className="text-[9px] px-1.5 py-0 h-4">{ch}</Badge>
              ))}
            </div>
            {c.lastClickedAt && (
              <p className="text-[10px] text-muted-foreground">
                마지막 클릭: {new Date(c.lastClickedAt).toLocaleString("ko-KR")}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
