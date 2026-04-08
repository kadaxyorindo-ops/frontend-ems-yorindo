import type { AuthUser } from "@/context/AuthContext";

/**
 * Returns the first page a user should land on after login,
 * based on their role and permissions.
 *
 * Priority order: events → communication → surveys → settings.
 * Settings is the universal fallback — every authenticated user can access it.
 */
export function getHomePage(user: AuthUser): string {
  if (user.role === "super_admin" || user.role === "admin") return "/events";
  if (user.permissions.includes("events:view")) return "/events";
  if (user.permissions.includes("communication:view")) return "/communication";
  if (user.permissions.includes("surveys:view")) return "/surveys";
  return "/settings";
}
