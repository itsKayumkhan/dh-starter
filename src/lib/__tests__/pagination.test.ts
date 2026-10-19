import { describe, expect, it } from "vitest";
import { pageCount, parseListParams } from "@/lib/pagination";

const options = {
  sortable: ["createdAt", "email"] as const,
  filters: ["role"] as const,
  defaultSort: { field: "createdAt", dir: "desc" } as const,
};

describe("parseListParams", () => {
  it("uses safe defaults for invalid values", () => {
    expect(parseListParams({ page: "-3", pageSize: "999", sort: "password:asc", role: " " }, options))
      .toEqual({ page: 1, pageSize: 20, skip: 0, take: 20, q: "", sort: options.defaultSort, filters: {} });
  });

  it("accepts allowlisted sort and filters and trims search", () => {
    expect(parseListParams({ page: "3", pageSize: "50", sort: "email:asc", role: " staff ", unknown: "x", q: `  ${"a".repeat(110)} ` }, options))
      .toEqual({ page: 3, pageSize: 50, skip: 100, take: 50, q: "a".repeat(100), sort: { field: "email", dir: "asc" }, filters: { role: "staff" } });
  });

  it("takes the first array value and rejects unsafe pages", () => {
    expect(parseListParams({ page: ["9007199254740992", "2"], pageSize: ["10", "20"] }, options))
      .toMatchObject({ page: 1, pageSize: 10 });
  });
});

describe("pageCount", () => {
  it("rounds up and handles empty counts", () => {
    expect(pageCount(21, 20)).toBe(2);
    expect(pageCount(0, 20)).toBe(0);
    expect(pageCount(20, 0)).toBe(0);
  });
});
