import { ROUTES } from "@/lib/constants/routes";

export const NOTIFICATION_ROUTES = {
  list: `${ROUTES.dashboard}/notifications`,
  send: `${ROUTES.admin}/notifications`,
  summary: `${ROUTES.api}/notifications/summary`,
} as const;
