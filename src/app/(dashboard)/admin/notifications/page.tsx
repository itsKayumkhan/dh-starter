import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { buildMetadata } from "@/lib/seo";
import { SendNotificationForm } from "@/modules/notifications/components/send-notification-form";
import { NOTIFICATION_MESSAGES } from "@/modules/notifications/messages";
import { NOTIFICATION_ROUTES } from "@/modules/notifications/routes";

export const metadata = buildMetadata({
  title: NOTIFICATION_MESSAGES.send,
  path: NOTIFICATION_ROUTES.send,
  noIndex: true,
});

async function AdminNotificationsPageContent() {
  const user = await requirePermission("notifications:send");
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">
          {NOTIFICATION_MESSAGES.send}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Send an in-app update to permitted recipients.
        </p>
      </div>
      <SendNotificationForm canReachAdmins={can(user, "users:write")} />
    </main>
  );
}

export default function AdminNotificationsPage() {
  return (
    <Suspense
      fallback={<PageSkeleton title="Send notification" variant="form" />}
    >
      <AdminNotificationsPageContent />
    </Suspense>
  );
}
