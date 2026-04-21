import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CLEARANCE_LABELS, type PageKey } from "@/lib/auth";

const ROLES = ["admin", "education", "marketing", "pending"] as const;

const ROLE_BASELINE: Record<string, PageKey[]> = {
  admin: ["dashboard", "survey", "link_tracking", "screening", "admin_users"],
  education: ["dashboard", "survey", "screening"],
  marketing: ["link_tracking"],
  pending: [],
};

const PAGE_LABELS: Record<PageKey, string> = {
  dashboard: "Dashboard (매출 대시보드)",
  survey: "Survey (만족도 분석)",
  link_tracking: "Link Tracking (마케팅)",
  screening: "Screening (심사 운영)",
  admin_users: "사용자 관리 (Admin)",
};

const ALL_PAGES: PageKey[] = ["dashboard", "survey", "link_tracking", "screening"];

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  department: string | null;
  title: string | null;
  role: string;
  clearance_level: number;
  allow_pages: string[] | null;
  deny_pages: string[] | null;
}

interface Props {
  profile: ProfileRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function UserDetailDrawer({ profile: p, open, onOpenChange, onSaved }: Props) {
  const [department, setDepartment] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("pending");
  const [clearance, setClearance] = useState(1);
  const [pageToggles, setPageToggles] = useState<Record<PageKey, boolean>>({
    dashboard: false,
    survey: false,
    link_tracking: false,
    screening: false,
    admin_users: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!p) return;
    setDepartment(p.department ?? "");
    setTitle(p.title ?? "");
    setRole(p.role);
    setClearance(p.clearance_level ?? 1);

    // Compute effective toggles
    const baseline = new Set<PageKey>(ROLE_BASELINE[p.role] ?? []);
    if (p.allow_pages) p.allow_pages.forEach((k) => baseline.add(k as PageKey));
    if (p.deny_pages) p.deny_pages.forEach((k) => baseline.delete(k as PageKey));

    const toggles: Record<PageKey, boolean> = {
      dashboard: baseline.has("dashboard"),
      survey: baseline.has("survey"),
      link_tracking: baseline.has("link_tracking"),
      screening: baseline.has("screening"),
      admin_users: baseline.has("admin_users"),
    };
    setPageToggles(toggles);
  }, [p]);

  // When role changes, recalculate toggles based on new baseline
  function handleRoleChange(newRole: string) {
    setRole(newRole);
    const baseline = new Set<PageKey>(ROLE_BASELINE[newRole] ?? []);
    setPageToggles({
      dashboard: baseline.has("dashboard"),
      survey: baseline.has("survey"),
      link_tracking: baseline.has("link_tracking"),
      screening: baseline.has("screening"),
      admin_users: baseline.has("admin_users"),
    });
  }

  function handlePageToggle(key: PageKey, on: boolean) {
    setPageToggles((prev) => ({ ...prev, [key]: on }));
  }

  async function handleSave() {
    if (!p || saving) return;
    setSaving(true);

    try {
      const baseline = new Set<PageKey>(ROLE_BASELINE[role] ?? []);
      const allow_pages: string[] = [];
      const deny_pages: string[] = [];

      for (const key of ALL_PAGES) {
        const inBaseline = baseline.has(key);
        const isOn = pageToggles[key];
        if (isOn && !inBaseline) allow_pages.push(key);
        if (!isOn && inBaseline) deny_pages.push(key);
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          department: department.trim() || null,
          title: title.trim() || null,
          role,
          clearance_level: clearance,
          allow_pages: allow_pages.length > 0 ? allow_pages : null,
          deny_pages: deny_pages.length > 0 ? deny_pages : null,
        } as any)
        .eq("id", p.id);

      if (error) {
        toast.error("저장 실패: " + error.message);
      } else {
        toast.success("저장되었습니다.");
        onSaved();
        onOpenChange(false);
      }
    } catch (err) {
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (!p) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">사용자 상세 설정</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Read-only info */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">이메일</Label>
            <p className="text-sm font-medium">{p.email}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">이름</Label>
            <p className="text-sm font-medium">{p.full_name ?? "—"}</p>
          </div>

          <Separator />

          {/* Editable fields */}
          <div className="space-y-2">
            <Label htmlFor="dept" className="text-xs text-muted-foreground">부서</Label>
            <Input id="dept" value={department} onChange={(e) => setDepartment(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ttl" className="text-xs text-muted-foreground">직급</Label>
            <Input id="ttl" value={title} onChange={(e) => setTitle(e.target.value)} className="h-9" />
          </div>

          <Separator />

          {/* Role */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">권한 (Role)</Label>
            <Select value={role} onValueChange={handleRoleChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clearance */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">보안 등급 (Clearance)</Label>
            <Select value={String(clearance)} onValueChange={(v) => setClearance(Number(v))}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((lv) => (
                  <SelectItem key={lv} value={String(lv)}>
                    Lv.{lv} — {CLEARANCE_LABELS[lv]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Page access toggles */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">페이지 접근 권한</Label>
            <p className="text-[11px] text-muted-foreground/70">
              Role 기본 권한에 추가로 페이지를 허용/차단할 수 있습니다.
            </p>
            {ALL_PAGES.map((key) => (
              <div key={key} className="flex items-center justify-between py-1">
                <span className="text-sm">{PAGE_LABELS[key]}</span>
                <Switch
                  checked={pageToggles[key]}
                  onCheckedChange={(on) => handlePageToggle(key, on)}
                />
              </div>
            ))}
          </div>

          {/* Save */}
          <Button onClick={handleSave} disabled={saving} className="w-full gap-2 mt-4">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            저장
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
