export const ROLES = ["user", "staff", "admin"] as const;
export type Role = (typeof ROLES)[number];
export const PERMISSIONS = {
  "users:read": ["staff", "admin"],
  "users:write": ["admin"],
  "users:ban": ["admin"],
  "audit:read": ["admin"],
  "billing:manage": ["admin"],
  "media:write": ["staff", "admin"],
  "notifications:send": ["staff", "admin"],
  "inquiries:read": ["staff", "admin"],
  "settings:write": ["admin"],
} as const satisfies Record<string, readonly Role[]>;
export type Permission = keyof typeof PERMISSIONS;

export function can(
  user: { role?: string | null; banned?: boolean | null } | null,
  permission: Permission,
): boolean {
  if (!user || user.banned || !ROLES.some((role) => role === user.role))
    return false;
  const roles = PERMISSIONS[permission] as readonly string[] | undefined;
  return roles?.includes(user.role ?? "") ?? false;
}
