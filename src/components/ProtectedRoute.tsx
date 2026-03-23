import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { canAccess, getDefaultRoute } from "@/lib/auth";

interface Props {
  children: React.ReactNode;
  /** The current route path for access check */
  requiredPath?: string;
}

export function ProtectedRoute({ children, requiredPath }: Props) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredPath && !canAccess(user.role, requiredPath)) {
    return <Navigate to={getDefaultRoute(user.role)} replace />;
  }

  return <>{children}</>;
}
