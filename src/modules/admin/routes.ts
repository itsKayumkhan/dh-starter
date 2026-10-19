import { ROUTES } from "@/lib/constants/routes";

export const ADMIN_ROUTES = {
  users: `${ROUTES.admin}/users`,
  audit: `${ROUTES.admin}/audit`,
  user: (id: string) => `${ROUTES.admin}/users/${encodeURIComponent(id)}`,
  resetPassword: "/reset-password",
} as const;
