import { useState, useEffect } from "react";
import { Settings, AlertTriangle, Shield, Bot } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { marketingProvider } from "@/lib/marketing";
import type { MarketingSettings as SettingsType } from "@/lib/marketing/types";

interface Props {
  onSaved: () => void;
}

export function MarketingSettingsDialog({ onSaved }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  // Dedup
  const [dedupEnabled, setDedupEnabled] = useState(false);
  const [dedupWindow, setDedupWindow] = useState(60);
  const [botFilterEnabled, setBotFilterEnabled] = useState(true);

  const existing = marketingProvider.getSettings();
  const isConfigured = !!(existing?.link24_customer_id && existing?.link24_api_key);

  useEffect(() => {
    if (open && existing) {
      setCustomerId(existing.link24_customer_id);
      setApiKey(existing.link24_api_key);
      setBaseUrl(existing.tracking_base_url);
      setDedupEnabled(existing.dedup_enabled ?? false);
      setDedupWindow(existing.dedup_window_sec ?? 60);
      setBotFilterEnabled(existing.bot_filter_enabled ?? true);
    }
  }, [open]);

  const handleSave = () => {
    if (!customerId.trim() || !apiKey.trim()) {
      toast({ title: "필수 항목", description: "Customer ID와 API Key는 필수입니다.", variant: "destructive" });
      return;
    }
    const clampedWindow = Math.max(10, Math.min(300, dedupWindow || 60));
    const s: SettingsType = {
      link24_customer_id: customerId.trim(),
      link24_api_key: apiKey.trim(),
      tracking_base_url: baseUrl.trim() || window.location.origin,
      dedup_enabled: dedupEnabled,
      dedup_window_sec: clampedWindow,
      bot_filter_enabled: botFilterEnabled,
    };
    marketingProvider.saveSettings(s);
    toast({ title: "저장 완료", description: "설정이 저장되었습니다." });
    onSaved();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <Settings className="h-3 w-3" />
          설정
          {isConfigured ? (
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 bg-emerald-500/15 text-emerald-600 border-emerald-500/30">설정됨</Badge>
          ) : (
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 bg-red-500/15 text-red-600 border-red-500/30">미설정</Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">마케팅 대시보드 설정</DialogTitle>
          <DialogDescription className="text-xs">Link24 API 및 클릭 추적 설정</DialogDescription>
        </DialogHeader>

        <Alert className="border-amber-500/30 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-xs text-amber-700 dark:text-amber-400">
            API 키는 브라우저에 저장됩니다. 추후 Supabase 적용 시 서버 보관으로 전환을 권장합니다.
          </AlertDescription>
        </Alert>

        <div className="space-y-3 mt-2">
          {/* Link24 API */}
          <div className="space-y-1.5">
            <Label className="text-xs">Link24 Customer ID *</Label>
            <Input value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="customer_..." className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Link24 API Key *</Label>
            <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" placeholder="api_..." className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">트래킹 도메인 (기본: 현재 앱)</Label>
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder={window.location.origin} className="h-8 text-sm" />
          </div>

          <Separator />

          {/* Dedup Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">클릭 중복 제거</span>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">중복 클릭 제거 활성화</Label>
              <Switch checked={dedupEnabled} onCheckedChange={setDedupEnabled} />
            </div>

            {dedupEnabled && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">중복 제거 윈도우 (초)</Label>
                <Input
                  type="number"
                  min={10}
                  max={300}
                  value={dedupWindow}
                  onChange={(e) => setDedupWindow(Number(e.target.value))}
                  className="h-8 text-sm w-24"
                />
                <p className="text-[10px] text-muted-foreground">같은 사용자가 이 시간 내 재클릭 시 1회만 집계 (10~300초)</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Bot className="h-3 w-3 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground">봇/프리뷰 클릭 제외</Label>
              </div>
              <Switch checked={botFilterEnabled} onCheckedChange={setBotFilterEnabled} />
            </div>
            <p className="text-[10px] text-muted-foreground">Slack, Discord, 카카오톡 등의 미리보기 봇 클릭을 제외합니다.</p>
          </div>

          <Button onClick={handleSave} className="w-full" size="sm">저장</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
