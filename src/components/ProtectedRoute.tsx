import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { canAccess, getDefaultRoute } from "@/lib/auth";

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

  if (requiredPath && !canAccess(role, requiredPath)) {
    return <Navigate to={getDefaultRoute(role)} replace />;
  }

  return <>{children}</>;
}
