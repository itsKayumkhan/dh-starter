import { Bell, Megaphone } from "lucide-react";
import type { AppModule } from "@/config/modules";
import { NotificationBell } from "@/modules/notifications/components/notification-bell";
import { NOTIFICATION_MESSAGES } from "@/modules/notifications/messages";
import { NOTIFICATION_ROUTES } from "@/modules/notifications/routes";

export const notificationsModule: AppModule = {
  id: "notifications",
  name: "In-app notifications",
  nav: [
    {
      title: NOTIFICATION_MESSAGES.title,
      href: NOTIFICATION_ROUTES.list,
      icon: Bell,
      section: "dashboard",
    },
    {
      title: NOTIFICATION_MESSAGES.send,
      href: NOTIFICATION_ROUTES.send,
      icon: Megaphone,
      section: "admin",
      permission: "notifications:send",
    },
  ],
  HeaderItem: NotificationBell,
};
