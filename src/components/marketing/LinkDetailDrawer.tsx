import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { marketingProvider } from "@/lib/marketing";
import { CHANNEL_OPTIONS, type MarketingLink, type MarketingChannel, type ClickEvent } from "@/lib/marketing/types";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

interface Props {
  link: MarketingLink | null;
  events: ClickEvent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function LinkDetailDrawer({ link, events, open, onOpenChange, onUpdated }: Props) {
  const [alias, setAlias] = useState("");
  const [channel, setChannel] = useState<MarketingChannel>("카페");
  const [campaign, setCampaign] = useState("");
  const [note, setNote] = useState("");

  // sync form when link changes
  useState(() => {
    if (link) {
      setAlias(link.alias);
      setChannel(link.channel);
      setCampaign(link.campaign);
      setNote(link.note);
    }
  });

  // Also watch link changes via key
  const linkId = link?.id;
  useMemo(() => {
    if (link) {
      setAlias(link.alias);
      setChannel(link.channel);
      setCampaign(link.campaign);
      setNote(link.note);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkId]);

  const chartData = useMemo(() => {
    if (!link) return [];
    const linkEvents = events.filter((e) => e.link_id === link.id);
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      days[key] = 0;
    }
    linkEvents.forEach((e) => {
      const d = new Date(e.timestamp);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([date, clicks]) => ({ date, clicks }));
  }, [link, events]);

  const handleSave = () => {
    if (!link) return;
    marketingProvider.updateLink(link.id, {
      alias: alias.trim(),
      channel,
      campaign: campaign.trim(),
      note: note.trim(),
    });
    onUpdated();
    onOpenChange(false);
  };

  if (!link) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">{link.alias}</SheetTitle>
          <SheetDescription className="text-xs">링크 상세 · 편집</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Stats */}
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground">총 클릭</p>
              <p className="text-2xl font-bold">{link.total_clicks}</p>
            </div>
            <Badge variant={link.status === "active" ? "default" : "secondary"}>
              {link.status === "active" ? "활성" : "비활성"}
            </Badge>
          </div>

          {/* Mini chart */}
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis hide />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Info */}
          <div className="space-y-1 text-xs">
            <p><span className="text-muted-foreground">단축 링크:</span> <code className="font-mono">{link.short_url}</code></p>
            <p><span className="text-muted-foreground">원래 링크:</span> <span className="break-all">{link.destination_url}</span></p>
            <p><span className="text-muted-foreground">생성일:</span> {new Date(link.created_at).toLocaleString("ko-KR")}</p>
            {link.last_clicked_at && (
              <p><span className="text-muted-foreground">마지막 클릭:</span> {new Date(link.last_clicked_at).toLocaleString("ko-KR")}</p>
            )}
          </div>

          {/* Edit form */}
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <Label className="text-xs">별명</Label>
              <Input value={alias} onChange={(e) => setAlias(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">채널</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as MarketingChannel)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHANNEL_OPTIONS.map((ch) => (
                    <SelectItem key={ch} value={ch}>{ch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">캠페인</Label>
              <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">메모</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[60px] text-sm" />
            </div>
            <Button onClick={handleSave} className="w-full" size="sm">저장</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
