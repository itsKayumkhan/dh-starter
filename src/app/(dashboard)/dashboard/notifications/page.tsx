import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import Link from "next/link";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { pageCount, parseListParams } from "@/lib/pagination";
import { buildMetadata } from "@/lib/seo";
import { NotificationList } from "@/modules/notifications/components/notification-list";
import { NOTIFICATION_MESSAGES } from "@/modules/notifications/messages";
import { NOTIFICATION_ROUTES } from "@/modules/notifications/routes";
import {
  getUnreadCount,
  listNotifications,
} from "@/modules/notifications/server/queries";

export const metadata = buildMetadata({
  title: NOTIFICATION_MESSAGES.title,
  path: NOTIFICATION_ROUTES.list,
  noIndex: true,
});

type SearchParams = Record<string, string | string[] | undefined>;
const statusSchema = z.enum(["all", "read", "unread"]);

function listHref(
  status: "all" | "read" | "unread",
  page: number,
  pageSize: number,
) {
  const search = new URLSearchParams();
  if (status !== "all") search.set("status", status);
  if (page > 1) search.set("page", String(page));
  if (pageSize !== 20) search.set("pageSize", String(pageSize));
  const query = search.toString();
  return query
    ? `${NOTIFICATION_ROUTES.list}?${query}`
    : NOTIFICATION_ROUTES.list;
}

async function NotificationsPageContent({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const params = parseListParams(await searchParams, {
    sortable: ["createdAt"],
    filters: ["status"],
    defaultSort: { field: "createdAt", dir: "desc" },
  });
  const status = statusSchema.safeParse(params.filters.status).data ?? "all";
  const [{ items, total }, unread] = await Promise.all([
    listNotifications(user.id, {
      skip: params.skip,
      take: params.take,
      status,
    }),
    getUnreadCount(user.id),
  ]);
  const pages = pageCount(total, params.pageSize);

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">
          {NOTIFICATION_MESSAGES.title}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Updates for your account.
        </p>
      </div>
      <nav aria-label="Notification filter" className="flex flex-wrap gap-2">
        {(["all", "unread", "read"] as const).map((option) => (
          <Link
            key={option}
            href={listHref(option, 1, params.pageSize)}
            aria-current={status === option ? "page" : undefined}
            className={`focus-visible:ring-ring rounded-md px-3 py-2 text-sm focus-visible:ring-2 ${status === option ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}
          >
            {option === "all"
              ? NOTIFICATION_MESSAGES.all
              : option === "unread"
                ? NOTIFICATION_MESSAGES.unread
                : NOTIFICATION_MESSAGES.read}
          </Link>
        ))}
      </nav>
      <NotificationList items={items} unread={unread} />
      {pages > 1 ? (
        <nav
          aria-label="Notification pages"
          className="flex items-center justify-between gap-3 text-sm"
        >
          {params.page > 1 ? (
            <Link
              href={listHref(status, params.page - 1, params.pageSize)}
              className="text-primary rounded underline-offset-4 hover:underline focus-visible:ring-2"
            >
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span>
            Page {params.page} of {pages}
          </span>
          {params.page < pages ? (
            <Link
              href={listHref(status, params.page + 1, params.pageSize)}
              className="text-primary rounded underline-offset-4 hover:underline focus-visible:ring-2"
            >
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </main>
  );
}

export default function NotificationsPage(props: Parameters<typeof NotificationsPageContent>[0]) {
  return <Suspense fallback={<PageSkeleton title="Notifications" />}><NotificationsPageContent {...props} /></Suspense>;
}
