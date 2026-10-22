import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import type { Permission } from "@/lib/auth/permissions";

export type ModuleNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  section: "dashboard" | "admin";
};

export type AppModule = {
  id: string;
  name: string;
  HeaderItem?: ComponentType;
  nav: ModuleNavItem[];
};
