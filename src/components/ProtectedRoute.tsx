import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { canAccess, getDefaultRoute } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

interface Props {
  children: React.ReactNode;
  requiredPath?: string;
}

export function ProtectedRoute({ children, requiredPath }: Props) {
  const { user, role, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  if (role === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-sm rounded-lg border bg-card p-8 text-center space-y-4 shadow-sm">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">권한 승인 대기 중</h2>
          <p className="text-sm text-muted-foreground">
            관리자가 권한을 부여한 후 사용할 수 있습니다.<br />
            잠시 후 다시 시도해주세요.
          </p>
        </div>
      </div>
    );
  }

  if (requiredPath && !canAccess(role, requiredPath)) {
    const defaultRoute = getDefaultRoute(role);
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

  return <>{children}</>;
}
