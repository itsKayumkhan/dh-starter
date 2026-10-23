import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { assertPermission, assertUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { assertRateLimit } from "@/lib/rate-limit";
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
    const user = await assertUser();
    await assertRateLimit(`uploads:sign:${user.id}`, 30, 3600);
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
    const signed = await storage.sign({
      folder: parsed.data.folder,
      ownerId: user.id,
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
