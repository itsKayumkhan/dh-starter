import { describe, expect, it, vi } from "vitest";
import { retryDbRead } from "@/lib/retry-db-read";

describe("retryDbRead", () => {
  it("retries a read once after a dropped connection", async () => {
    const read = vi.fn()
      .mockRejectedValueOnce(new Error("Connection terminated unexpectedly"))
      .mockResolvedValueOnce(42);
    await expect(retryDbRead(read)).resolves.toBe(42);
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("does not retry unrelated errors", async () => {
    const error = new Error("Access denied");
    const read = vi.fn().mockRejectedValue(error);
    await expect(retryDbRead(read)).rejects.toBe(error);
    expect(read).toHaveBeenCalledTimes(1);
  });
});
