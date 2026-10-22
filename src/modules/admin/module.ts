import { ScrollText, Users } from "lucide-react";
import type { AppModule } from "@/config/module-types";
import { ADMIN_ROUTES } from "@/modules/admin/routes";

export const adminModule: AppModule = {
  id: "admin",
  name: "Admin users and audit",
  nav: [
    {
      title: "Users",
      href: ADMIN_ROUTES.users,
      icon: Users,
      permission: "users:read",
      section: "admin",
    },
    {
      title: "Audit log",
      href: ADMIN_ROUTES.audit,
      icon: ScrollText,
      permission: "audit:read",
      section: "admin",
    },
  ],
};
