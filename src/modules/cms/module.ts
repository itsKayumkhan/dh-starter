import { FileText, Settings } from "lucide-react";
import type { AppModule } from "@/config/module-types";
import { CMS_ROUTES } from "@/modules/cms/routes";

export const cmsModule: AppModule = {
  id: "cms",
  name: "Content management",
  nav: [
    {
      title: "Site settings",
      href: CMS_ROUTES.settings,
      icon: Settings,
      permission: "settings:write",
      section: "admin",
    },
    {
      title: "Content",
      href: CMS_ROUTES.content,
      icon: FileText,
      permission: "content:write",
      section: "admin",
    },
  ],
};
