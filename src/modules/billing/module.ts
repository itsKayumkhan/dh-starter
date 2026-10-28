import { CreditCard, Receipt } from "lucide-react";
import type { AppModule } from "@/config/module-types";
import { BILLING_ROUTES } from "@/modules/billing/routes";

export const billingModule: AppModule = {
  id: "billing",
  name: "Stripe billing",
  publicRoutes: [BILLING_ROUTES.pricing],
  nav: [
    {
      title: "Billing",
      href: BILLING_ROUTES.dashboard,
      icon: CreditCard,
      section: "dashboard",
    },
    {
      title: "Payments",
      href: BILLING_ROUTES.admin,
      icon: Receipt,
      section: "admin",
      permission: "billing:manage",
    },
  ],
};
