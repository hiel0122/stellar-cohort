export type UserRole = "admin" | "education" | "marketing";

export interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

const AUTH_KEY = "auth_user_v1";

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function storeUser(user: AuthUser): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(AUTH_KEY);
}

/** Mock sign-in — will be replaced with Supabase Auth */
export function mockSignIn(role: UserRole = "admin"): AuthUser {
  const user: AuthUser = {
    email: "user@company.com",
    name: "Studio User",
    role,
  };
  storeUser(user);
  return user;
}

/** Route access matrix */
const ROLE_ROUTES: Record<UserRole, string[]> = {
  admin: ["/dashboard", "/satisfaction", "/media-commerce/marketing"],
  education: ["/dashboard", "/satisfaction"],
  marketing: ["/media-commerce/marketing"],
};

export function getAllowedRoutes(role: UserRole): string[] {
  return ROLE_ROUTES[role] ?? [];
}

export function canAccess(role: UserRole, pathname: string): boolean {
  const routes = ROLE_ROUTES[role];
  if (!routes) return false;
  return routes.some((r) => pathname.startsWith(r));
}

export function getDefaultRoute(role: UserRole): string {
  return ROLE_ROUTES[role]?.[0] ?? "/dashboard";
}
