import { useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingCharts } from "@/components/marketing/MarketingCharts";
import { LinkTable } from "@/components/marketing/LinkTable";
import { Badge } from "@/components/ui/badge";
import type { MarketingLink, ClickEvent } from "@/lib/marketing/types";

interface Props {
  campaign: string;
  links: MarketingLink[];
  events: ClickEvent[];
  onBack: () => void;
  onSelectLink: (link: MarketingLink) => void;
}

export function CampaignDetail({ campaign, links, events, onBack, onSelectLink }: Props) {
  const filteredLinks = useMemo(
    () => links.filter((l) => (l.campaign || "(미지정)") === campaign),
    [links, campaign],
  );

  const filteredEvents = useMemo(() => {
    const linkIds = new Set(filteredLinks.map((l) => l.id));
    return events.filter((e) => linkIds.has(e.link_id));
  }, [filteredLinks, events]);

  const totalClicks = filteredLinks.reduce((s, l) => s + l.total_clicks, 0);
  const channels = [...new Set(filteredLinks.map((l) => l.channel))];

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={onBack}>
          <ChevronLeft className="h-3.5 w-3.5" />
          Campaigns
        </Button>
        <span className="text-muted-foreground text-xs">/</span>
        <span className="text-sm font-medium truncate">{campaign}</span>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <p className="text-[10px] text-muted-foreground">총 클릭</p>
          <p className="text-xl font-bold tabular-nums">{totalClicks.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">링크 수</p>
          <p className="text-xl font-bold tabular-nums">{filteredLinks.length}</p>
        </div>
        <div className="flex items-center gap-1">
          {channels.map((ch) => (
            <Badge key={ch} variant="secondary" className="text-[9px]">{ch}</Badge>
          ))}
        </div>
      </div>

      {/* UTM summary if any */}
      {filteredLinks.some((l) => l.utm_enabled) && (
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <p className="text-[10px] text-muted-foreground mb-1">UTM 요약</p>
          <div className="flex flex-wrap gap-2 text-[11px] font-mono">
            {filteredLinks
              .filter((l) => l.utm_campaign)
              .slice(0, 3)
              .map((l) => (
                <Badge key={l.id} variant="outline" className="text-[10px]">
                  {l.utm_source}/{l.utm_medium}/{l.utm_campaign}
                </Badge>
              ))}
          </div>
        </div>
      )}

      {/* Links */}
      <LinkTable links={filteredLinks} onSelect={onSelectLink} />

      {/* Charts */}
      <MarketingCharts links={filteredLinks} events={filteredEvents} />
    </div>
  );
}
