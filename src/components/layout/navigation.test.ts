import { describe, expect, it, vi } from "vitest";

// Module HeaderItems import server actions; nav logic does not need them or their env.
vi.mock("@/modules/notifications/server/actions", () => ({ markAllRead: vi.fn() }));
import { visibleNav, type ShellUser } from "@/components/layout/navigation";
import { AUTH_ROUTES } from "@/components/auth/routes";
import { ROUTES } from "@/lib/constants/routes";

const user: ShellUser = { id: "u1", name: "Test User", email: "user@example.test", image: null, role: "user" };

describe("visibleNav", () => {
  it("includes dashboard and account links for a signed-in user", () => {
    const hrefs = visibleNav(user).map((item) => item.href);
    expect(hrefs).toContain(ROUTES.dashboard);
    expect(hrefs).toContain(AUTH_ROUTES.account);
    expect(hrefs).not.toContain(ROUTES.admin);
  });

  it("includes admin only for authorized roles and denies unknown roles", () => {
    expect(visibleNav({ ...user, role: "staff" }).map((item) => item.href)).toContain(ROUTES.admin);
    expect(visibleNav({ ...user, role: "admin" }).map((item) => item.href)).toContain(ROUTES.admin);
    expect(visibleNav({ ...user, role: "owner" }).map((item) => item.href)).not.toContain(ROUTES.admin);
  });
});
