import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { assertPermission, assertUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { assertRateLimit } from "@/lib/rate-limit";
import { getServerEnv } from "@/lib/env/server";
import { createPendingUpload } from "@/modules/uploads/server/media";
import { storage } from "@/modules/uploads/server/storage";
import {
  UPLOAD_RULES,
  uploadFolderSchema,
  validateUploadFile,
} from "@/modules/uploads/upload-rules";

const bodySchema = z.object({
  folder: uploadFolderSchema,
  bytes: z.number().int().positive(),
  mimeType: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    const expectedOrigin = new URL(getServerEnv().BETTER_AUTH_URL).origin;
    if (origin !== expectedOrigin)
      return Response.json(
        { error: "Invalid request origin." },
        { status: 403 },
      );
    if (
      !/^application\/json(?:\s*;|$)/i.test(
        request.headers.get("content-type") ?? "",
      )
    )
      return Response.json({ error: "JSON is required." }, { status: 415 });
    const user = await assertUser();
    const body: unknown = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success)
      return Response.json(
        { error: "Invalid upload request." },
        { status: 400 },
      );
    const error = validateUploadFile(parsed.data);
    if (error) return Response.json({ error }, { status: 400 });
    if (UPLOAD_RULES[parsed.data.folder].adminOnly)
      await assertPermission("media:write");
    await assertRateLimit(`uploads:sign:${user.id}`, 30, 3600);
    const signed = await storage.sign({
      folder: parsed.data.folder,
      ownerId: user.id,
    });
    await createPendingUpload({
      publicId: signed.publicId,
      ownerId: user.id,
      folder: parsed.data.folder,
      expectedBytes: parsed.data.bytes,
      mimeType: parsed.data.mimeType,
    });
    return Response.json(signed, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    // Let Next control-flow errors (redirect, 403, request-time bailout) pass through.
    unstable_rethrow(error);
    if (error instanceof SyntaxError)
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    if (error instanceof AppError)
      return Response.json(
        { error: error.message },
        {
          status:
            error.code === "UNAUTHORIZED"
              ? 401
              : error.code === "RATE_LIMIT"
                ? 429
                : 403,
        },
      );
    logger.error("Upload signing failed", { error });
    return Response.json({ error: "Could not sign upload." }, { status: 500 });
  }
}
