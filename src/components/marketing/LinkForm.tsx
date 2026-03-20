import { useState } from "react";
import { Plus, Copy, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { marketingProvider, createShortLink } from "@/lib/marketing";
import { CHANNEL_OPTIONS, type MarketingChannel } from "@/lib/marketing/types";

interface Props {
  onCreated: () => void;
}

function generateTrackCode(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function LinkForm({ onCreated }: Props) {
  const { toast } = useToast();
  const [alias, setAlias] = useState("");
  const [channel, setChannel] = useState<MarketingChannel>("카페");
  const [campaign, setCampaign] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ short_url: string; track_code: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const settings = marketingProvider.getSettings();
  const hasSettings = !!(settings?.link24_customer_id && settings?.link24_api_key);

  const handleSubmit = async () => {
    if (!alias.trim() || !destinationUrl.trim()) {
      toast({ title: "필수 항목 입력", description: "별명과 최종 URL은 필수입니다.", variant: "destructive" });
      return;
    }
    if (!hasSettings) {
      toast({ title: "API 미설정", description: "설정에서 Link24 API 정보를 입력해주세요.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const track_code = generateTrackCode();
      const baseUrl = settings!.tracking_base_url || window.location.origin;
      const trackingUrl = `${baseUrl}/r/${track_code}`;

      const { short_url } = await createShortLink(trackingUrl, settings!);

      marketingProvider.createLink({
        alias: alias.trim(),
        channel,
        campaign: campaign.trim(),
        destination_url: destinationUrl.trim(),
        short_url,
        track_code,
        note: note.trim(),
      });

      setResult({ short_url, track_code });
      toast({ title: "링크 생성 완료", description: `${alias} 단축 링크가 생성되었습니다.` });
      onCreated();

      // reset form
      setAlias("");
      setCampaign("");
      setDestinationUrl("");
      setNote("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류";
      toast({ title: "링크 생성 실패", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="h-4 w-4" /> 단축 링크 생성
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasSettings && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Link24 API가 설정되지 않았습니다. 우측 상단 설정에서 입력해주세요.</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="alias">별명 *</Label>
            <Input id="alias" placeholder="예: 3월 세미나 블로그" value={alias} onChange={(e) => setAlias(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>채널</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as MarketingChannel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.map((ch) => (
                  <SelectItem key={ch} value={ch}>{ch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="campaign">캠페인</Label>
            <Input id="campaign" placeholder="예: 5기 모집" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dest">최종 URL *</Label>
            <Input id="dest" placeholder="https://..." value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="note">메모</Label>
          <Textarea id="note" placeholder="선택 사항" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[60px]" />
        </div>

        <Button onClick={handleSubmit} disabled={loading || !hasSettings} className="w-full sm:w-auto">
          {loading ? "생성 중…" : "단축 링크 생성"}
        </Button>

        {result && (
          <div className="rounded-md border bg-muted/30 p-3 space-y-1">
            <p className="text-xs text-muted-foreground">생성된 단축 링크</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono break-all flex-1">{result.short_url}</code>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleCopy(result.short_url)}>
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">트래킹 코드: {result.track_code}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
