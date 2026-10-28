import { describe, expect, it } from "vitest";
import {
  inquiryStatusSchema,
  submitInquirySchema,
} from "@/modules/contact/schemas/inquiry";

const valid = {
  name: "Taylor Smith",
  email: "taylor@example.com",
  message: "Please contact me about the project.",
  source: "/contact",
  formToken: "signed-token",
  website: "",
};

describe("inquiry input", () => {
  it("accepts a valid inquiry and trims visible fields", () => {
    const result = submitInquirySchema.parse({
      ...valid,
      name: "  Taylor Smith  ",
    });
    expect(result.name).toBe("Taylor Smith");
  });

  it("rejects external source paths and oversized messages", () => {
    expect(
      submitInquirySchema.safeParse({ ...valid, source: "//evil.test" })
        .success,
    ).toBe(false);
    expect(
      submitInquirySchema.safeParse({ ...valid, message: "a".repeat(5001) })
        .success,
    ).toBe(false);
  });

  it("accepts only the three stored status values", () => {
    expect(inquiryStatusSchema.safeParse("in_progress").success).toBe(true);
    expect(inquiryStatusSchema.safeParse("deleted").success).toBe(false);
  });
});
