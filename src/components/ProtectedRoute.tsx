import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { canAccess, getDefaultRoute } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

interface Props {
  children: React.ReactNode;
  requiredPath?: string;
}

export function ProtectedRoute({ children, requiredPath }: Props) {
  const { user, profile, role, isAuthenticated, loading, profileLoading } = useAuth();
  const location = useLocation();

  // Still bootstrapping session
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  // Profile is still loading — do NOT route to /pending before role is resolved
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (role === "pending") {
    return <Navigate to="/pending" replace state={{ from: location.pathname }} />;
  }

  if (requiredPath && !canAccess(role, requiredPath, profile)) {
    const defaultRoute = getDefaultRoute(role, profile);
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-sm rounded-lg border bg-card p-8 text-center space-y-4 shadow-sm">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">접근 권한이 없습니다</h2>
          <p className="text-sm text-muted-foreground">이 페이지에 대한 접근 권한이 없습니다.</p>
          <Button asChild size="sm">
            <a href={defaultRoute}>허용된 페이지로 이동</a>
          </Button>
        </div>
      </div>
    );
  }

  return profileLoading ? (
    <div className="relative min-h-screen">
      {children}
      <div className="pointer-events-none absolute inset-0 z-40 flex items-start justify-center bg-background/10 pt-6 backdrop-blur-[1px]">
        <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/85 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          세션 동기화 중…
        </div>
      </div>
    </div>
  ) : <>{children}</>;
}
