import { describe, expect, it } from "vitest";
import { formatBytes, formatDate, formatDateTime, formatMoney, formatNumber, formatRelative } from "@/lib/format";

describe("shared formatting", () => {
  it("renders dates in UTC, independent of the machine time zone", () => {
    expect(formatDate("2026-01-02T00:30:00.000Z")).toBe("Jan 2, 2026");
    expect(formatDateTime("2026-01-02T00:30:00.000Z")).toBe("Jan 2, 2026, 12:30 AM");
  });

  it("uses an explicit reference for relative dates", () => {
    expect(formatRelative("2026-01-01T11:00:00.000Z", "2026-01-01T12:00:00.000Z")).toBe("1 hour ago");
    expect(formatRelative("2026-01-02T12:00:00.000Z", "2026-01-01T12:00:00.000Z")).toBe("tomorrow");
  });

  it("formats currency minor units, numbers, and bytes consistently", () => {
    expect(formatMoney(1299, "usd")).toBe("$12.99");
    expect(formatMoney(1299, "jpy")).toBe("¥1,299");
    expect(formatNumber(12345)).toBe("12,345");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });
});
