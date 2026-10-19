import { describe, expect, it } from "vitest";
import { z } from "zod";
import { fail, fromZodError, ok } from "@/lib/action-result";
describe("action result", () => {
  it("returns distinct success and failure shapes", () => {
    expect(ok(3)).toEqual({ ok: true, data: 3 });
    expect(fail("bad")).toEqual({ ok: false, error: "bad" });
  });
  it("groups nested field errors", () => {
    const parsed = z
      .object({ profile: z.object({ email: z.email() }) })
      .safeParse({ profile: { email: "bad" } });
    if (parsed.success) throw new Error("Expected invalid input");
    expect(fromZodError(parsed.error)["profile.email"]).toHaveLength(1);
  });
});
