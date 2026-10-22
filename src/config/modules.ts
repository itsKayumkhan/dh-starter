import type { AppModule } from "@/config/module-types";
export type { AppModule, ModuleNavItem } from "@/config/module-types";

// Module imports and installedModules entries each end with // module:<id> for module-remove.
import { adminModule } from "@/modules/admin/module"; // module:admin
import { uploadsModule } from "@/modules/uploads/module"; // module:uploads
import { billingModule } from "@/modules/billing/module"; // module:billing
import { notificationsModule } from "@/modules/notifications/module"; // module:notifications
import { contactModule } from "@/modules/contact/module"; // module:contact

export const installedModules: AppModule[] = [
  adminModule, // module:admin
  uploadsModule, // module:uploads
  billingModule, // module:billing
  notificationsModule, // module:notifications
  contactModule, // module:contact
];
