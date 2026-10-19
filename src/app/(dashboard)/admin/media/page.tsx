import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { requirePermission } from "@/lib/auth/session";
import { pageCount, parseListParams } from "@/lib/pagination";
import { MediaLibrary } from "@/modules/uploads/components/media-library";
import { listMedia } from "@/modules/uploads/server/media";
import { uploadFolderSchema } from "@/modules/uploads/upload-rules";

async function MediaPageContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("media:write");
  const params = parseListParams(await searchParams, {
    sortable: ["createdAt"],
    filters: ["folder"],
    defaultSort: { field: "createdAt", dir: "desc" },
  });
  const folder = uploadFolderSchema.safeParse(params.filters.folder).data;
  const result = await listMedia({
    skip: params.skip,
    take: params.take,
    q: params.q,
    folder,
    sort: { field: "createdAt", dir: params.sort.dir === "asc" ? "asc" : "desc" },
  });
  return (
    <MediaLibrary
      items={result.items}
      total={result.total}
      page={params.page}
      pages={pageCount(result.total, params.pageSize)}
      pageSize={params.pageSize}
      query={params.q}
      folder={folder}
    />
  );
}

export default function MediaPage(props: Parameters<typeof MediaPageContent>[0]) {
  return <Suspense fallback={<PageSkeleton title="Media library" />}><MediaPageContent {...props} /></Suspense>;
}
