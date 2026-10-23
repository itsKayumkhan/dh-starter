import { describe, expect, it } from "vitest";
import {
  formatBytes,
  formatDate,
  formatDateTime,
  formatMoney,
  formatMonth,
  formatNumber,
  formatRelative,
} from "@/lib/format";

describe("shared formatting", () => {
  it("renders dates in UTC, independent of the machine time zone", () => {
    expect(formatDate("2026-01-02T00:30:00.000Z")).toBe("Jan 2, 2026");
    expect(formatDateTime("2026-01-02T00:30:00.000Z")).toBe(
      "Jan 2, 2026, 12:30 AM",
    );
    expect(formatMonth("2026-01-02T00:30:00.000Z")).toBe("Jan");
  });

  it("formats one instant in the requested time zone", () => {
    const instant = "2026-01-01T00:30:00.000Z";

    expect(formatDate(instant, "en-US", "UTC")).toBe("Jan 1, 2026");
    expect(formatDate(instant, "en-US", "America/Los_Angeles")).toBe(
      "Dec 31, 2025",
    );
    expect(formatDate(instant, undefined, "America/Los_Angeles")).toBe(
      "Dec 31, 2025",
    );
    expect(formatDateTime(instant, "en-US", "UTC")).toBe(
      "Jan 1, 2026, 12:30 AM",
    );
    expect(formatDateTime(instant, "en-US", "America/Los_Angeles")).toBe(
      "Dec 31, 2025, 4:30 PM",
    );
    expect(formatMonth(instant, "en-US", "UTC")).toBe("Jan");
    expect(formatMonth(instant, "en-US", "America/Los_Angeles")).toBe("Dec");
    expect(formatDate(instant, "en-GB", "UTC")).toBe("1 Jan 2026");
  });

  it("uses an explicit reference for relative dates", () => {
    expect(
      formatRelative("2026-01-01T11:00:00.000Z", "2026-01-01T12:00:00.000Z"),
    ).toBe("1 hour ago");
    expect(
      formatRelative("2026-01-02T12:00:00.000Z", "2026-01-01T12:00:00.000Z"),
    ).toBe("tomorrow");
    expect(
      formatRelative(
        "2026-01-01T11:00:00.000Z",
        "2026-01-01T12:00:00.000Z",
        "fr-FR",
      ),
    ).toBe("il y a 1 heure");
  });

  it("formats currency minor units, numbers, and bytes consistently", () => {
    expect(formatMoney(1299, "usd")).toBe("$12.99");
    expect(formatMoney(1299, "jpy")).toBe("¥1,299");
    expect(formatNumber(12345)).toBe("12,345");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });
});
