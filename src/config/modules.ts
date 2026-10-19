import type { LucideIcon } from "lucide-react";
import type { Permission } from "@/lib/auth/permissions";

export type AppModule = {
  id: string;
  name: string;
  nav: {
    title: string;
    href: string;
    icon: LucideIcon;
    permission?: Permission;
    section: "dashboard" | "admin";
  }[];
};

// Module imports and installedModules entries each end with // module:<id> for module-remove.
export const installedModules: AppModule[] = [];
