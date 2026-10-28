import { describe, expect, it } from "vitest";
import { settingsDefaults, settingsSchema } from "@/config/settings";

describe("settings validation", () => {
  it.each([
    { fontFamily: "Arial; background-image:url(https://attacker.test/pixel)" },
    { bodyPadding: "24px; color:red" },
    { bodyMargin: "0; background:url(https://attacker.test)" },
    { containerWidth: "100%; color:red" },
    { containerMargin: "0 auto; color:red" },
    { buttonPadding: "12px 20px; color:red" },
  ])("rejects CSS declarations in email style fields: %j", (change) => {
    expect(
      settingsSchema.safeParse({
        ...settingsDefaults,
        email: { ...settingsDefaults.email, ...change },
      }).success,
    ).toBe(false);
  });
  it("accepts the starter email defaults", () => {
    expect(settingsSchema.safeParse(settingsDefaults).success).toBe(true);
  });
});
