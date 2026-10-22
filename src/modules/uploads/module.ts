import { Images } from "lucide-react";
import type { AppModule } from "@/config/module-types";
import { UPLOAD_ROUTES } from "@/modules/uploads/routes";

export const uploadsModule: AppModule = {
  id: "uploads",
  name: "Cloudinary uploads",
  nav: [
    {
      title: "Media library",
      href: UPLOAD_ROUTES.media,
      icon: Images,
      permission: "media:write",
      section: "admin",
    },
  ],
};
