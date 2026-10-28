import { describe, expect, it } from "vitest";
import { blockRevision, settingsRevision } from "@/modules/cms/server/revision";

describe("editor revisions", () => {
  it("includes settings values when timestamps collide", () => {
    const updatedAt = new Date("2026-10-28T00:00:00.000Z");
    expect(settingsRevision([{ key: "name", updatedAt, value: "A" }])).not.toBe(
      settingsRevision([{ key: "name", updatedAt, value: "B" }]),
    );
  });
  it("ignores JSON object key order but includes block values", () => {
    const updatedAt = new Date("2026-10-28T00:00:00.000Z");
    expect(blockRevision({ updatedAt, value: { a: 1, b: 2 } })).toBe(
      blockRevision({ updatedAt, value: { b: 2, a: 1 } }),
    );
    expect(blockRevision({ updatedAt, value: { a: 1 } })).not.toBe(
      blockRevision({ updatedAt, value: { a: 2 } }),
    );
  });
});
