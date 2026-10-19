import { describe, expect, it } from "vitest";
import {
  profileSchema,
  changePasswordSchema,
} from "@/features/account/schemas/account";

describe("account schemas", () => {
  it("allows clearing an image and rejects unsafe image URLs", () => {
    expect(profileSchema.safeParse({ name: "Ada", imageUrl: "" }).success).toBe(
      true,
    );
    expect(
      profileSchema.safeParse({ name: "Ada", imageUrl: "javascript:alert(1)" })
        .success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({
        name: "Ada",
        imageUrl: "http://example.com/me.png",
      }).success,
    ).toBe(false);
  });
  it("requires matching replacement passwords", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "OldPass123",
        newPassword: "NewPass123",
        confirmPassword: "wrong",
        revokeOtherSessions: true,
      }).success,
    ).toBe(false);
  });
});
