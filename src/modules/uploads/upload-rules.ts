import { z } from "zod";

export const UPLOAD_RULES = {
  avatars: {
    resourceType: "image",
    maxBytes: 2 * 1024 * 1024,
    formats: ["jpg", "jpeg", "png", "webp", "avif"] as readonly string[],
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ] as readonly string[],
    adminOnly: false,
  },
  media: {
    resourceType: "image",
    maxBytes: 10 * 1024 * 1024,
    formats: ["jpg", "jpeg", "png", "webp", "avif", "gif"] as readonly string[],
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/gif",
    ] as readonly string[],
    adminOnly: true,
  },
  documents: {
    resourceType: "raw",
    maxBytes: 10 * 1024 * 1024,
    formats: ["pdf"] as readonly string[],
    mimeTypes: ["application/pdf"] as readonly string[],
    adminOnly: true,
  },
} as const;

export const uploadFolderSchema = z.enum(["avatars", "media", "documents"]);
export type UploadFolder = z.infer<typeof uploadFolderSchema>;

export type UploadFile = {
  folder: UploadFolder;
  bytes: number;
  mimeType: string;
};

export function validateUploadFile({
  folder,
  bytes,
  mimeType,
}: UploadFile): string | null {
  const rule = UPLOAD_RULES[folder];
  if (!Number.isSafeInteger(bytes) || bytes < 1 || bytes > rule.maxBytes)
    return `File must be between 1 byte and ${Math.round(rule.maxBytes / 1024 / 1024)} MB.`;
  if (!(rule.mimeTypes as readonly string[]).includes(mimeType.toLowerCase()))
    return "File type is not allowed in this folder.";
  return null;
}

export function validateStoredAsset(input: {
  folder: UploadFolder;
  bytes: number;
  format: string;
  resourceType: string;
}): string | null {
  const rule = UPLOAD_RULES[input.folder];
  if (
    !Number.isSafeInteger(input.bytes) ||
    input.bytes < 1 ||
    input.bytes > rule.maxBytes
  )
    return "Uploaded file exceeds the folder size limit.";
  if (input.resourceType !== rule.resourceType)
    return "Uploaded file has the wrong resource type.";
  if (!(rule.formats as readonly string[]).includes(input.format.toLowerCase()))
    return "Uploaded file format is not allowed in this folder.";
  return null;
}

export function hasExpectedPublicId(
  publicId: string,
  prefix: string,
  folder: UploadFolder,
) {
  const suffix = folder === "documents" ? "\\.pdf" : "";
  return new RegExp(
    `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/${folder}/[0-9a-f-]{36}${suffix}$`,
    "i",
  ).test(publicId);
}
