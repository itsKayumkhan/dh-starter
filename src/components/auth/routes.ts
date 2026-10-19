import { ROUTES } from "@/lib/constants/routes";

export const AUTH_ROUTES = {
  forgotPassword: ROUTES.forgotPassword,
  resetPassword: ROUTES.resetPassword,
  verifyEmail: ROUTES.verifyEmail,
  verifyEmailSuccess: `${ROUTES.verifyEmail}?verified=1`,
  account: ROUTES.account,
} as const;
