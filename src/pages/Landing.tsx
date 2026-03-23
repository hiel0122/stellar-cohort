import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { getDefaultRoute } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Link2, ClipboardList } from "lucide-react";

export default function Landing() {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user) {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-widest uppercase text-foreground">
            운영 Studio
          </span>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-4 font-medium bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400"
          >
            Beta
          </Badge>
        </div>
        <Link to="/auth">
          <Button size="sm" className="gap-1.5">
            로그인 <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              교육 운영의 모든 지표를
              <br />
              <span className="text-primary">한 곳에서</span> 관리하세요
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              매출 대시보드, 만족도 분석, 마케팅 링크 트래킹까지.
              <br />
              데이터 기반 의사결정을 위한 통합 운영 도구입니다.
            </p>
          </div>

          <Link to="/auth">
            <Button size="lg" className="h-12 px-8 text-base gap-2">
              시작하기 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
            {[
              { icon: BarChart3, title: "매출 대시보드", desc: "기수별 KPI와 정산 현황을 실시간으로" },
              { icon: ClipboardList, title: "만족도 분석", desc: "CSV 업로드로 설문 결과 즉시 분석" },
              { icon: Link2, title: "링크 트래킹", desc: "단축 링크 생성과 클릭 추적을 한번에" },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border/70 bg-card p-5 text-left space-y-2"
              >
                <f.icon className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-muted-foreground/50">
        © 2025 운영 Studio
      </footer>
    </div>
  );
}
