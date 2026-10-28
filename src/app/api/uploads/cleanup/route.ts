import { timingSafeEqual } from "node:crypto";
import { cleanupExpiredUploads } from "@/modules/uploads/server/media";
import { getUploadsCronSecret } from "@/modules/uploads/env";
import { logger } from "@/lib/logger";

async function run(request: Request) {
  try {
    const token =
      request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
    const secret = getUploadsCronSecret();
    const provided = Buffer.from(token);
    const expected = Buffer.from(secret);
    if (
      provided.length !== expected.length ||
      !timingSafeEqual(provided, expected)
    )
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    const result = await cleanupExpiredUploads();
    return Response.json(result, {
      status: result.failed ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    logger.error("Upload cleanup failed", { error });
    return Response.json({ error: "Cleanup failed." }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
