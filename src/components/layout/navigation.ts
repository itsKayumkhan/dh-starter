import { CircleUserRound, LayoutDashboard, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { installedModules } from "@/config/modules";
import { can, type Permission } from "@/lib/auth/permissions";
import { ROUTES } from "@/lib/constants/routes";
import { AUTH_ROUTES } from "@/components/auth/routes";

export type ShellUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
};

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  section: "dashboard" | "admin";
  permission?: Permission;
};

const coreItems: NavItem[] = [
  { title: "Overview", href: ROUTES.dashboard, icon: LayoutDashboard, section: "dashboard" },
  { title: "Account", href: AUTH_ROUTES.account, icon: CircleUserRound, section: "dashboard" },
  { title: "Overview", href: ROUTES.admin, icon: Shield, section: "admin", permission: "users:read" },
];

export function visibleNav(user: ShellUser): NavItem[] {
  const isStaff = user.role === "staff" || user.role === "admin";
  return [
    ...coreItems,
    ...installedModules.flatMap((module) => module.nav),
  ].filter((item) =>
    (item.section !== "admin" || isStaff) &&
    (!item.permission || can(user, item.permission)),
  );
}
