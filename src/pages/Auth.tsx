import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { getDefaultRoute, type UserRole } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BarChart3, ClipboardList, Link2, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function Auth() {
  const { user, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [devRole, setDevRole] = useState<UserRole>("admin");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && user) {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }

  const handleSignIn = () => {
    setLoading(true);
    // simulate brief delay
    setTimeout(() => {
      signIn(devRole);
      navigate(getDefaultRoute(devRole));
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left brand panel */}
      <div className="relative flex-1 flex flex-col justify-center px-8 py-12 lg:px-16 bg-muted/30 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-primary/8 blur-3xl" />

        <div className="relative z-10 max-w-md space-y-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> 홈으로
          </Link>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-widest uppercase text-foreground">
                운영 Studio
              </span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 font-medium bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400"
              >
                Beta
              </Badge>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              교육 운영 데이터를
              <br />
              한 곳에서 관리하세요
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              매출·정산·만족도·마케팅 지표를 통합 관리하는 운영 도구입니다.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: BarChart3, label: "매출 대시보드 — KPI, 정산, 퍼널 분석" },
              { icon: ClipboardList, label: "만족도 분석 — CSV 기반 설문 리포트" },
              { icon: Link2, label: "링크 트래킹 — 단축 링크 & 클릭 추적" },
            ].map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <f.icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login card */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16 bg-background">
        <Card className="w-full max-w-sm shadow-lg border-border/60 rounded-2xl">
          <CardContent className="pt-8 pb-8 px-8 space-y-6">
            <div className="space-y-1.5 text-center">
              <h3 className="text-xl font-semibold text-foreground">Sign in</h3>
              <p className="text-sm text-muted-foreground">
                회사 Google 계정(Workspace)으로 로그인하세요
              </p>
            </div>

            <Button
              onClick={handleSignIn}
              disabled={loading}
              variant="outline"
              className="w-full h-12 text-sm font-medium gap-3 border-border hover:bg-accent transition-colors"
            >
              <GoogleIcon className="h-5 w-5" />
              {loading ? "로그인 중…" : "Continue with Google"}
            </Button>

            <p className="text-[11px] text-muted-foreground/70 text-center">
              @company.com 도메인 계정만 허용 예정
            </p>

            {/* DEV-only role selector */}
            <div className="border-t border-border/50 pt-4 space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium">
                Dev — Role 선택
              </p>
              <Select value={devRole} onValueChange={(v) => setDevRole(v as UserRole)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin (전체 접근)</SelectItem>
                  <SelectItem value="education">Education (대시보드+Survey)</SelectItem>
                  <SelectItem value="marketing">Marketing (Link Tracking)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
