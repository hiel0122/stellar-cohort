import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { getDefaultRoute } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BrandWordmark } from "@/components/brand/BrandWordmark";
import { ProfileEditModal } from "@/components/ProfileEditModal";
import { ShieldAlert, Copy, LogOut, RefreshCw, UserPen } from "lucide-react";
import { toast } from "sonner";
import type { UserRole } from "@/lib/auth";

export default function Pending() {
  const { user, profile, role, signOut, loading, profileLoading } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  // Immediately redirect if role is not pending (prevents flicker)
  useEffect(() => {
    if (loading || profileLoading) return;
    if (!profile) return; // still no profile, stay put
    if (role !== "pending") {
      navigate(getDefaultRoute(role, profile), { replace: true });
    }
  }, [role, loading, profileLoading, profile, navigate]);

  // Auto-poll every 8 seconds — only when session is ready and role is pending
  useEffect(() => {
    if (!user || loading || profileLoading) return;
    if (role !== "pending") return;

    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (data && data.role !== "pending") {
          const newRole = data.role as UserRole;
          window.location.href = getDefaultRoute(newRole, data as any);
        }
      } catch {}
    }, 8000);
    return () => clearInterval(interval);
  }, [user, loading, profileLoading, role]);

  const handleManualCheck = useCallback(async () => {
    if (!user) return;
    setChecking(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (data && data.role !== "pending") {
        toast.success("권한이 승인되었습니다!");
        window.location.href = getDefaultRoute(data.role as UserRole);
      } else {
        toast.info("아직 승인 대기 중입니다.");
      }
    } finally {
      setChecking(false);
    }
  }, [user]);

  const handleCopyRequest = useCallback(() => {
    const text = `[Con-tudio 권한 요청]\n이름: ${profile?.full_name ?? "미입력"}\n이메일: ${user?.email ?? ""}\n부서: ${profile?.department ?? "미입력"}\n직급: ${profile?.title ?? "미입력"}\n\n위 계정에 대한 접근 권한 승인을 요청드립니다.`;
    navigator.clipboard.writeText(text);
    toast.success("요청 메시지가 복사되었습니다.");
  }, [user, profile]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <BrandWordmark className="text-3xl" />
        </div>

        <div className="rounded-lg border bg-card p-8 text-center space-y-5 shadow-sm">
          <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground" />

          <div className="space-y-2">
            <h1 className="text-xl font-semibold">권한 승인 대기 중</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              관리자가 권한을 부여하면<br />
              Dashboard · Survey · Link Tracking을 사용할 수 있습니다.
            </p>
          </div>

          <div className="rounded-md border bg-muted/30 p-4 text-left text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">이메일</span>
              <span className="font-medium">{user?.email ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">이름</span>
              <span className="font-medium">{profile?.full_name ?? "미입력"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">부서</span>
              <span className="font-medium">{profile?.department ?? "미입력"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">직급</span>
              <span className="font-medium">{profile?.title ?? "미입력"}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <Button onClick={handleManualCheck} disabled={checking} variant="default" className="w-full gap-2">
              <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
              {checking ? "확인 중…" : "승인 상태 새로고침"}
            </Button>

            <Button onClick={handleCopyRequest} variant="outline" className="w-full gap-2">
              <Copy className="h-4 w-4" />
              승인 요청 메시지 복사
            </Button>

            <Button onClick={() => setProfileOpen(true)} variant="outline" className="w-full gap-2">
              <UserPen className="h-4 w-4" />
              내 정보 수정
            </Button>

            <Button onClick={handleLogout} variant="ghost" className="w-full gap-2 text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground/60">
            8초마다 자동으로 승인 상태를 확인합니다.
          </p>
        </div>
      </div>

      <ProfileEditModal open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}
