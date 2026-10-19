import { assertPermission } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { pageCount, parseListParams } from "@/lib/pagination";
import { listMedia } from "@/modules/uploads/server/media";
import { uploadFolderSchema } from "@/modules/uploads/upload-rules";

export async function GET(request: Request) {
  try {
    await assertPermission("media:write");
    const params = Object.fromEntries(
      new URL(request.url).searchParams.entries(),
    );
    const parsed = parseListParams(params, {
      sortable: ["createdAt"],
      filters: ["folder"],
      defaultSort: { field: "createdAt", dir: "desc" },
    });
    const folder = uploadFolderSchema.safeParse(parsed.filters.folder).data;
    const result = await listMedia({
      skip: parsed.skip,
      take: parsed.take,
      q: parsed.q,
      folder,
      sort: { field: "createdAt", dir: parsed.sort.dir === "asc" ? "asc" : "desc" },
    });
    return Response.json(
      {
        ...result,
        page: parsed.page,
        pageCount: pageCount(result.total, parsed.pageSize),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof AppError)
      return Response.json(
        { error: error.message },
        { status: error.code === "UNAUTHORIZED" ? 401 : 403 },
      );
    logger.error("Media list failed", { error });
    return Response.json({ error: "Could not load media." }, { status: 500 });
  }
}
