import { describe, expect, it } from "vitest";
import { ROUTES } from "@/lib/constants/routes";
import { adminSendSchema, notificationInputSchema } from "./notification";

describe("notification validation", () => {
  const base = {
    broadcastId: "376aef70-f63a-47f9-9228-6cb84c36dcbf",
    target: "all",
    title: "Update",
    body: "News",
    email: false,
  };

  it("requires the selected target detail", () => {
    expect(adminSendSchema.safeParse({ ...base, target: "user" }).success).toBe(
      false,
    );
    expect(adminSendSchema.safeParse({ ...base, target: "role" }).success).toBe(
      false,
    );
    expect(
      adminSendSchema.safeParse({ ...base, target: "user", userId: "user-1" })
        .success,
    ).toBe(true);
  });

  it("allows local links and rejects external redirects", () => {
    expect(
      notificationInputSchema.safeParse({
        type: "info",
        title: "Update",
        body: "News",
        href: ROUTES.dashboard,
      }).success,
    ).toBe(true);
    expect(
      notificationInputSchema.safeParse({
        type: "info",
        title: "Update",
        body: "News",
        href: "//evil.example",
      }).success,
    ).toBe(false);
    expect(
      notificationInputSchema.safeParse({
        type: "info",
        title: "Update",
        body: "News",
        href: "https://evil.example",
      }).success,
    ).toBe(false);
  });
});
