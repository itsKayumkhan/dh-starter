import { describe, expect, it } from "vitest";
import {
  hasExpectedPublicId,
  validateStoredAsset,
  validateUploadFile,
} from "@/modules/uploads/upload-rules";

describe("upload rules", () => {
  it("allows a small avatar and rejects oversized or mismatched files", () => {
    expect(
      validateUploadFile({
        folder: "avatars",
        bytes: 1024,
        mimeType: "image/png",
      }),
    ).toBeNull();
    expect(
      validateUploadFile({
        folder: "avatars",
        bytes: 2 * 1024 * 1024 + 1,
        mimeType: "image/png",
      }),
    ).toMatch(/2 MB/);
    expect(
      validateUploadFile({
        folder: "documents",
        bytes: 1024,
        mimeType: "image/png",
      }),
    ).toMatch(/not allowed/);
  });

  it("checks stored format and size independently of client metadata", () => {
    expect(
      validateStoredAsset({
        folder: "documents",
        bytes: 500,
        format: "pdf",
        resourceType: "raw",
      }),
    ).toBeNull();
    expect(
      validateStoredAsset({
        folder: "documents",
        bytes: 500,
        format: "svg",
        resourceType: "raw",
      }),
    ).toMatch(/format/);
    expect(
      validateStoredAsset({
        folder: "media",
        bytes: 20 * 1024 * 1024,
        format: "jpg",
        resourceType: "image",
      }),
    ).toMatch(/size/);
  });

  it("requires an exact signed folder and generated id shape", () => {
    const id = "72df58a3-ec17-4dd8-96b2-d2fc044713c7";
    expect(hasExpectedPublicId(`site/media/${id}`, "site", "media")).toBe(true);
    expect(
      hasExpectedPublicId(`site/documents/${id}.pdf`, "site", "documents"),
    ).toBe(true);
    expect(hasExpectedPublicId(`other/media/${id}`, "site", "media")).toBe(
      false,
    );
    expect(hasExpectedPublicId(`site/media/${id}/extra`, "site", "media")).toBe(
      false,
    );
  });
});
