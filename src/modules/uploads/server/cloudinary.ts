import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";
import { ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getUploadsEnv } from "@/modules/uploads/env";
import type { Storage } from "@/modules/uploads/server/storage-types";
import {
  hasExpectedPublicId,
  UPLOAD_RULES,
  validateStoredAsset,
} from "@/modules/uploads/upload-rules";

const assetSchema = z.object({
  public_id: z.string(),
  secure_url: z.url().startsWith("https://"),
  resource_type: z.string(),
  type: z.string(),
  format: z.string(),
  bytes: z.number().int(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
});

function configuredClient() {
  const env = getUploadsEnv();
  cloudinary.config({
    cloud_name: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return env;
}

function ticketFor(
  secret: string,
  ownerId: string,
  publicId: string,
  folder: string,
  timestamp: number,
) {
  return createHmac("sha256", secret)
    .update(`${ownerId}\n${publicId}\n${folder}\n${timestamp}`)
    .digest("hex");
}

function verifyTicket(
  secret: string,
  ownerId: string,
  publicId: string,
  folder: string,
  ticket: string,
) {
  const [timeText, digest] = ticket.split(".");
  const timestamp = Number(timeText);
  if (
    !Number.isSafeInteger(timestamp) ||
    !digest ||
    !/^[a-f0-9]{64}$/.test(digest)
  )
    throw new ValidationError();
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 20 * 60)
    throw new ValidationError();
  const expected = ticketFor(secret, ownerId, publicId, folder, timestamp);
  if (
    !timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(expected, "hex"))
  )
    throw new ValidationError();
}

export const cloudinaryStorage: Storage = {
  async sign({ folder, ownerId }) {
    const env = configuredClient();
    const rule = UPLOAD_RULES[folder];
    const timestamp = Math.floor(Date.now() / 1000);
    const id = randomUUID() + (folder === "documents" ? ".pdf" : "");
    const cloudFolder = `${env.CLOUDINARY_FOLDER_PREFIX}/${folder}`;
    const publicId = `${cloudFolder}/${id}`;
    const params = {
      timestamp: String(timestamp),
      folder: cloudFolder,
      public_id: id,
      allowed_formats: rule.formats.join(","),
      overwrite: "false",
      unique_filename: "false",
    };
    return {
      cloudName: env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      uploadUrl: `https://api.cloudinary.com/v1_1/${env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${rule.resourceType}/upload`,
      params,
      signature: cloudinary.utils.api_sign_request(
        params,
        env.CLOUDINARY_API_SECRET,
      ),
      publicId,
      folder,
      ticket: `${timestamp}.${ticketFor(env.CLOUDINARY_API_SECRET, ownerId, publicId, folder, timestamp)}`,
    };
  },

  async verify({ folder, ownerId, publicId, ticket }) {
    const env = configuredClient();
    verifyTicket(env.CLOUDINARY_API_SECRET, ownerId, publicId, folder, ticket);
    if (!hasExpectedPublicId(publicId, env.CLOUDINARY_FOLDER_PREFIX, folder))
      throw new ValidationError();
    const resourceType = UPLOAD_RULES[folder].resourceType;
    const response: unknown = await cloudinary.api.resource(publicId, {
      resource_type: resourceType,
      type: "upload",
    });
    const parsed = assetSchema.safeParse(response);
    if (!parsed.success) throw new ValidationError();
    const asset = parsed.data;
    const error = validateStoredAsset({
      folder,
      bytes: asset.bytes,
      format: asset.format,
      resourceType: asset.resource_type,
    });
    if (asset.public_id !== publicId || asset.type !== "upload")
      throw new ValidationError();
    if (error) {
      try {
        await cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
          type: "upload",
          invalidate: true,
        });
      } catch (cleanupError) {
        logger.error("Rejected upload cleanup failed", { error: cleanupError });
      }
      throw new ValidationError();
    }
    return {
      publicId,
      url: asset.secure_url,
      resourceType: asset.resource_type,
      format: asset.format,
      bytes: asset.bytes,
      width: asset.width ?? null,
      height: asset.height ?? null,
      folder,
    };
  },

  async destroy({ publicId, resourceType }) {
    configuredClient();
    const response: unknown = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type: "upload",
      invalidate: true,
    });
    const parsed = z.object({ result: z.string() }).safeParse(response);
    if (!parsed.success || !["ok", "not found"].includes(parsed.data.result))
      throw new Error("Cloudinary could not remove the asset.");
  },
};
