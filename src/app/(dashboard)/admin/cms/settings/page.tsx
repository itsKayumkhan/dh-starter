import { Suspense } from "react";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { formatDateTime } from "@/lib/format";
import { SettingsForm } from "@/modules/cms/components/settings-form";
import { getSettingsEditorData } from "@/modules/cms/server/queries";

async function SettingsContent() {
  await requirePermission("settings:write");
  const { value, rows, editors } = await getSettingsEditorData();
  const last = rows.sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  )[0];
  return (
    <main className="space-y-6">
      <PageHeader
        title="Site settings"
        description="Edit the brand, contact details, colors and SEO defaults."
      />
      {last ? (
        <p className="text-muted-foreground text-sm">
          Last updated {formatDateTime(last.updatedAt)} by{" "}
          {last.updatedBy
            ? (editors[last.updatedBy] ?? last.updatedBy)
            : "Unknown"}
        </p>
      ) : null}
      <SettingsForm initialValue={value} />
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton title="Site settings" />}>
      <SettingsContent />
    </Suspense>
  );
}
