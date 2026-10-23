import { describe, expect, it } from "vitest";
import { contentRegistry } from "@/config/content";
import {
  emptyItem,
  fieldsForItem,
  moveItem,
} from "@/modules/cms/components/field-mapping";

describe("content field mapping", () => {
  it("maps item fields to nested form paths", () => {
    const fields = contentRegistry["home.faq"].fields[1].fields ?? [];
    expect(fieldsForItem(fields, "items.2").map(({ path }) => path)).toEqual([
      "items.2.question",
      "items.2.answer",
    ]);
    expect(emptyItem(fields)).toEqual({ question: "", answer: "" });
  });
  it("moves items without mutating the input", () => {
    const original = ["first", "second"];
    expect(moveItem(original, 0, 1)).toEqual(["second", "first"]);
    expect(original).toEqual(["first", "second"]);
  });
});
