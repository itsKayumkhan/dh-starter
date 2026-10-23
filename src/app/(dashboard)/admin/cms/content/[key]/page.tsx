import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { contentRegistry, type ContentKey } from "@/config/content";
import { requirePermission } from "@/lib/auth/session";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { formatDateTime } from "@/lib/format";
import { parseContent } from "@/lib/content/blocks";
import { BlockForm } from "@/modules/cms/components/block-form";
import { CMS_ROUTES } from "@/modules/cms/routes";
import { getBlockEditorData } from "@/modules/cms/server/queries";

async function BlockContent({ params }: { params: Promise<{ key: string }> }) {
  await requirePermission("content:write");
  const { key } = await params;
  if (!(key in contentRegistry)) notFound();
  const blockKey = key as ContentKey;
  const { block, row, editorName } = await getBlockEditorData(blockKey);
  return (
    <main className="max-w-3xl space-y-6">
      <Link href={CMS_ROUTES.content} className="text-sm underline">
        All content
      </Link>
      <div>
        <h1 className="text-3xl font-semibold">{block.label}</h1>
        <p className="text-muted-foreground text-sm">
          {block.group} / {key}
        </p>
        {row ? (
          <p className="text-muted-foreground text-sm">
            Last updated {formatDateTime(row.updatedAt)} by{" "}
            {editorName ?? "Unknown"}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">Using default content</p>
        )}
      </div>
      <BlockForm
        blockKey={blockKey}
        initialValue={
          parseContent(blockKey, row?.value) as Record<string, unknown>
        }
      />
    </main>
  );
}

export default function Page(props: { params: Promise<{ key: string }> }) {
  return (
    <Suspense fallback={<PageSkeleton title="Content" />}>
      <BlockContent {...props} />
    </Suspense>
  );
}
