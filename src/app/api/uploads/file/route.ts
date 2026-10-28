import { unstable_rethrow } from "next/navigation";
import { assertPermission, assertUser } from "@/lib/auth/session";
import { AppError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
  claimPendingUpload,
  getPendingUpload,
  markPendingUploaded,
} from "@/modules/uploads/server/media";
import { storage } from "@/modules/uploads/server/storage";
import {
  UPLOAD_RULES,
  uploadFolderSchema,
} from "@/modules/uploads/upload-rules";
import { getServerEnv } from "@/lib/env/server";

export async function POST(request: Request) {
  try {
    if (
      request.headers.get("origin") !==
      new URL(getServerEnv().BETTER_AUTH_URL).origin
    )
      return Response.json(
        { error: "Invalid request origin." },
        { status: 403 },
      );
    const user = await assertUser();
    const parsed = uploadFolderSchema.safeParse(
      request.headers.get("x-upload-folder"),
    );
    if (!parsed.success) throw new ValidationError();
    const folder = parsed.data;
    if (UPLOAD_RULES[folder].adminOnly) await assertPermission("media:write");
    const publicId = request.headers.get("x-upload-public-id") ?? "";
    const ticket = request.headers.get("x-upload-ticket") ?? "";
    const pending = await getPendingUpload(publicId, user.id);
    if (
      !pending ||
      pending.folder !== folder ||
      pending.uploadingAt ||
      pending.uploadedAt ||
      pending.mimeType !== request.headers.get("content-type")
    )
      throw new ValidationError();
    const max = Math.min(pending.expectedBytes, UPLOAD_RULES[folder].maxBytes);
    const length = Number(request.headers.get("content-length"));
    if (Number.isFinite(length) && length > max)
      return Response.json(
        { error: "File exceeds the signed size." },
        { status: 413 },
      );
    if (!request.body) throw new ValidationError();
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > max) {
          await reader.cancel();
          return Response.json(
            { error: "File exceeds the signed size." },
            { status: 413 },
          );
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    if (size !== pending.expectedBytes) throw new ValidationError();
    await claimPendingUpload(publicId, user.id);
    const asset = await storage.upload({
      folder,
      ownerId: user.id,
      publicId,
      ticket,
      bytes: Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))),
    });
    try {
      await markPendingUploaded(publicId, user.id);
    } catch (error) {
      await storage.destroy({ publicId, resourceType: asset.resourceType });
      throw error;
    }
    return Response.json(
      { public_id: asset.publicId },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AppError)
      return Response.json(
        { error: error.message },
        { status: error.code === "UNAUTHORIZED" ? 401 : 403 },
      );
    logger.error("Upload failed", { error });
    return Response.json({ error: "Upload failed." }, { status: 500 });
  }
}
