import { Inbox } from "lucide-react";
import type { AppModule } from "@/config/module-types";
import { CONTACT_ROUTES } from "@/modules/contact/routes";

export const contactModule: AppModule = {
  id: "contact",
  name: "Contact form and inquiries",
  nav: [
    {
      title: "Inquiries",
      href: CONTACT_ROUTES.inquiries,
      icon: Inbox,
      section: "admin",
      permission: "inquiries:read",
    },
  ],
};
