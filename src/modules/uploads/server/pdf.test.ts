import { describe, expect, it, vi } from "vitest";
vi.mock("@/modules/uploads/env", () => ({ getUploadsEnv: vi.fn() }));
import { isPdf } from "@/modules/uploads/server/cloudinary";

describe("PDF byte validation", () => {
  it("rejects arbitrary bytes with a PDF filename", () => {
    expect(isPdf(Buffer.from("<script>alert(1)</script>"))).toBe(false);
  });
  it("requires a PDF header, object and end marker", () => {
    const body = "%PDF-1.7\n1 0 obj\n<</Type /Catalog>>\nendobj\n";
    const pdf = `${body}xref\n0 2\n0000000000 65535 f\n0000000009 00000 n\ntrailer\n<</Size 2 /Root 1 0 R>>\nstartxref\n${Buffer.byteLength(body)}\n%%EOF\n`;
    expect(isPdf(Buffer.from(pdf))).toBe(true);
    expect(isPdf(Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n"))).toBe(false);
  });
});
