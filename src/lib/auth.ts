export type UserRole = "admin" | "education" | "marketing" | "pending";

/** Route access matrix */
const ROLE_ROUTES: Record<UserRole, string[]> = {
  admin: ["/dashboard", "/satisfaction", "/media-commerce/marketing", "/admin/users"],
  education: ["/dashboard", "/satisfaction"],
  marketing: ["/media-commerce/marketing"],
  pending: [],
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

const ALLOWED_DOMAIN = "bobusanggroup.com";

export function isAllowedDomain(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.endsWith(`@${ALLOWED_DOMAIN}`);
}
