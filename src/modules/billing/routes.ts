import { ROUTES } from "@/lib/constants/routes";

export const BILLING_ROUTES = {
  pricing: "/pricing",
  dashboard: `${ROUTES.dashboard}/billing`,
  success: `${ROUTES.dashboard}/billing/success`,
  cancel: `${ROUTES.dashboard}/billing/cancel`,
  admin: `${ROUTES.admin}/billing`,
  adminSubscriptions: `${ROUTES.admin}/billing/subscriptions`,
  webhook: `${ROUTES.api}/billing/webhook`,
} as const;
