import { useState, useEffect } from "react";
import { Settings, Shield, Bot, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { marketingProvider } from "@/lib/marketing";
import type { MarketingSettings as SettingsType } from "@/lib/marketing/types";

interface Props {
  onSaved: () => void;
}

export function MarketingSettingsDialog({ onSaved }: Props) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  // Dedup
  const [dedupEnabled, setDedupEnabled] = useState(false);
  const [dedupWindow, setDedupWindow] = useState(60);
  const [botFilterEnabled, setBotFilterEnabled] = useState(true);

  const [isConfigured, setIsConfigured] = useState(false);

  // Load settings from DB on open
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "link24")
          .maybeSingle();

        const val = data?.value as Record<string, unknown> | null;
        if (val) {
          setCustomerId((val.customer_id as string) ?? "");
          setBaseUrl((val.tracking_domain as string) ?? "");
          setDedupEnabled(!!(val.dedup_enabled));
          setDedupWindow(Number(val.dedup_window_sec) || 60);
          setBotFilterEnabled(val.bot_filter_enabled !== false);
          setIsConfigured(!!(val.customer_id));
        } else {
          setCustomerId("");
          setBaseUrl("");
          setIsConfigured(false);
        }

        // Also sync local provider for dedup/bot settings
        const existing = marketingProvider.getSettings();
        if (existing) {
          setDedupEnabled(existing.dedup_enabled ?? false);
          setDedupWindow(existing.dedup_window_sec ?? 60);
          setBotFilterEnabled(existing.bot_filter_enabled ?? true);
        }
      } catch {
        // ignore load errors
      }
    })();
  }, [open]);

  const handleSave = async () => {
    if (!isAdmin) {
      toast({ title: "권한 없음", description: "관리자만 설정을 변경할 수 있습니다.", variant: "destructive" });
      return;
    }
    if (!customerId.trim()) {
      toast({ title: "필수 항목", description: "Customer ID는 필수입니다.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const clampedWindow = Math.max(10, Math.min(300, dedupWindow || 60));
      const trackingDomain = baseUrl.trim() || window.location.origin;

      // Save to DB (app_settings)
      const { error } = await supabase.from("app_settings").upsert({
        key: "link24",
        value: {
          customer_id: customerId.trim(),
          tracking_domain: trackingDomain,
          dedup_enabled: dedupEnabled,
          dedup_window_sec: clampedWindow,
          bot_filter_enabled: botFilterEnabled,
        },
        updated_by: profile?.id ?? null,
      });

      if (error) throw error;

      // Also save to local provider for dedup/bot runtime use
      const localSettings: SettingsType = {
        link24_customer_id: customerId.trim(),
        link24_api_key: "", // no longer used
        tracking_base_url: trackingDomain,
        dedup_enabled: dedupEnabled,
        dedup_window_sec: clampedWindow,
        bot_filter_enabled: botFilterEnabled,
      };
      marketingProvider.saveSettings(localSettings);

      toast({ title: "저장 완료", description: "설정이 저장되었습니다." });
      setIsConfigured(true);
      onSaved();
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "저장 실패";
      toast({ title: "저장 실패", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

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
          <DialogDescription className="text-xs">Link24 및 클릭 추적 설정</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Link24 Customer ID */}
          <div className="space-y-1.5">
            <Label className="text-xs">Link24 Customer ID *</Label>
            <Input value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="customer_..." className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">트래킹 도메인 (기본: 현재 앱)</Label>
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder={window.location.origin} className="h-8 text-sm" />
          </div>

          <p className="text-[10px] text-muted-foreground">API 키는 Supabase(서버) Secrets에서 관리됩니다.</p>

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

          <Button onClick={handleSave} disabled={saving} className="w-full" size="sm">
            {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />저장 중…</> : "저장"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
