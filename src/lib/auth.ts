export type UserRole = "admin" | "education" | "marketing" | "pending";

/** Page keys used for permission control */
export type PageKey = "dashboard" | "survey" | "link_tracking" | "screening" | "admin_users";

/** Route ↔ PageKey mapping */
export const PAGE_ROUTE_MAP: Record<PageKey, string> = {
  dashboard: "/dashboard",
  survey: "/satisfaction",
  link_tracking: "/media-commerce/marketing",
  screening: "/seminar/screening",
  admin_users: "/admin/users",
};

/** Role baseline page access */
const ROLE_PAGES: Record<UserRole, PageKey[]> = {
  admin: ["dashboard", "survey", "link_tracking", "screening", "admin_users"],
  education: ["dashboard", "survey", "screening"],
  marketing: ["link_tracking"],
  pending: [],
};

export interface PermissionProfile {
  role: string;
  allow_pages?: string[] | null;
  deny_pages?: string[] | null;
  clearance_level?: number;
}

/** Compute effective page keys from role + overrides */
export function getEffectivePages(profile: PermissionProfile | null): PageKey[] {
  if (!profile) return [];
  const role = toUserRole(profile.role);
  if (role === "pending") return [];

  const baseline = new Set<PageKey>(ROLE_PAGES[role] ?? []);

  // Add allow_pages
  if (profile.allow_pages) {
    for (const p of profile.allow_pages) {
      if (p in PAGE_ROUTE_MAP) baseline.add(p as PageKey);
    }
  }

  // Remove deny_pages
  if (profile.deny_pages) {
    for (const p of profile.deny_pages) {
      baseline.delete(p as PageKey);
    }
  }

  // admin_users is always included for admin role only
  if (role !== "admin") baseline.delete("admin_users");

  return Array.from(baseline);
}

/** Get allowed routes from effective pages */
export function getAllowedRoutes(role: UserRole, profile?: PermissionProfile | null): string[] {
  const pages = getEffectivePages(profile ?? { role });
  return pages.map((p) => PAGE_ROUTE_MAP[p]);
}

/** Check if a pathname is accessible */
export function canAccess(role: UserRole, pathname: string, profile?: PermissionProfile | null): boolean {
  const routes = getAllowedRoutes(role, profile);
  return routes.some((r) => pathname.startsWith(r));
}

/** Get default route for the user */
export function getDefaultRoute(role: UserRole, profile?: PermissionProfile | null): string {
  const routes = getAllowedRoutes(role, profile);
  return routes[0] ?? "/pending";
}

function toUserRole(raw: string | undefined | null): UserRole {
  const valid: UserRole[] = ["admin", "education", "marketing", "pending"];
  if (raw && valid.includes(raw as UserRole)) return raw as UserRole;
  return "pending";
}

/** Clearance level labels */
export const CLEARANCE_LABELS: Record<number, string> = {
  1: "일반",
  2: "선임",
  3: "팀장",
  4: "임원/관리자",
};

/** Check if user meets minimum clearance */
export function hasClearance(profile: PermissionProfile | null, minLevel: number): boolean {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  return (profile.clearance_level ?? 1) >= minLevel;
}

const ALLOWED_DOMAIN = "bobusanggroup.com";

export function isAllowedDomain(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.endsWith(`@${ALLOWED_DOMAIN}`);
}
