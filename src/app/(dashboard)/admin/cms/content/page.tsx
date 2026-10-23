import Link from "next/link";
import { Suspense } from "react";
import { contentKeys, contentRegistry } from "@/config/content";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { CMS_ROUTES } from "@/modules/cms/routes";

async function ContentList() {
  await requirePermission("content:write");
  const groups = [
    ...new Set(contentKeys.map((key) => contentRegistry[key].group)),
  ];
  return (
    <main className="space-y-6">
      <PageHeader
        title="Content"
        description="Edit content blocks used by the public site."
      />
      {groups.map((group) => (
        <section key={group} className="space-y-3">
          <h2 className="text-xl font-semibold">{group}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {contentKeys
              .filter((key) => contentRegistry[key].group === group)
              .map((key) => (
                <Link
                  key={key}
                  href={CMS_ROUTES.block(key)}
                  className="hover:bg-muted focus-visible:outline-ring rounded-lg border p-4"
                >
                  <span className="font-medium">
                    {contentRegistry[key].label}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {key}
                  </span>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton title="Content" />}>
      <ContentList />
    </Suspense>
  );
}
