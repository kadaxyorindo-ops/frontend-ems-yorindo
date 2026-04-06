import { useAuth } from "@/hooks/useAuth";

/**
 * Returns true if the current user has the given permission.
 *
 * super_admin always returns true — they bypass all permission checks,
 * mirroring the requirePermission() behaviour on the backend.
 *
 * Use this for UX gating only (hiding buttons, links, sections).
 * The backend always enforces permissions independently.
 *
 * @example
 *   const canCreate = usePermission("events:create");
 *   {canCreate && <Button>+ Create Event</Button>}
 */
export function usePermission(permission: string): boolean {
  const { user } = useAuth();
  if (!user) return false;
  if (user.role === "super_admin" || user.role === "admin") return true;
  return user.permissions.includes(permission);
}
