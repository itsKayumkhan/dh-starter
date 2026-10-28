import { formatDate, formatDateTime } from "@/lib/format";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BanForm,
  RoleForm,
  UserDangerActions,
} from "@/modules/admin/components/user-forms";
import { ADMIN_ROUTES } from "@/modules/admin/routes";
import { getUserDetail } from "@/modules/admin/server/queries";

const paramsSchema = z.object({ id: z.string().min(1).max(128) });

async function UserDetailPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await requirePermission("users:read");
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const user = await getUserDetail(parsed.data.id);
  if (!user) notFound();
  const isSelf = currentUser.id === user.id;
  const canManage = currentUser.role === "admin";
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
      <PageHeader
        title={user.name}
        description={user.email}
        actions={
          <Button asChild variant="outline">
            <Link href={ADMIN_ROUTES.users}>Back to users</Link>
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle role="heading" aria-level={2}>
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="size-14">
                <AvatarImage src={user.image ?? undefined} alt="" />
                <AvatarFallback>
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-muted-foreground text-sm">{user.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="capitalize">
                {user.role}
              </Badge>
              <Badge
                variant={user.status === "banned" ? "destructive" : "outline"}
                className="capitalize"
              >
                {user.status}
              </Badge>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd>
                  <time dateTime={user.createdAt}>
                    {formatDateTime(user.createdAt)}
                  </time>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last active</dt>
                <dd>
                  {user.lastActive ? (
                    <time dateTime={user.lastActive}>
                      {formatDateTime(user.lastActive)}
                    </time>
                  ) : (
                    "Never"
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle role="heading" aria-level={2}>
              Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {canManage && (
              <RoleForm id={user.id} role={user.role} disabled={isSelf} />
            )}
            {canManage && (
              <div className="border-t pt-5">
                <p className="mb-3 font-medium">Account actions</p>
                <UserDangerActions
                  id={user.id}
                  banned={user.status === "banned"}
                  isSelf={isSelf}
                />
              </div>
            )}
            {user.status === "banned" && (
              <p className="text-muted-foreground text-sm">
                Ban reason: {user.banReason ?? "None"}. Expiry:{" "}
                {user.banExpires
                  ? formatDateTime(user.banExpires)
                  : "No expiry"}
                .
              </p>
            )}
          </CardContent>
        </Card>
        {canManage && user.status !== "banned" && !isSelf && (
          <Card>
            <CardHeader>
              <CardTitle role="heading" aria-level={2}>
                Ban user
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BanForm id={user.id} />
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle role="heading" aria-level={2}>
              Active sessions ({user.sessionCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.sessions.length ? (
              <>
                <p className="text-muted-foreground mb-3 text-sm">
                  Showing up to 20 recent sessions.
                </p>
                <ul className="space-y-3">
                  {user.sessions.map((session) => (
                    <li
                      key={session.id}
                      className="rounded-md border p-3 text-sm"
                    >
                      <p>{session.userAgent ?? "Unknown device"}</p>
                      <p className="text-muted-foreground">
                        Last active {formatDateTime(session.lastActive)}
                      </p>
                      <p className="text-muted-foreground">
                        IP: {session.ipAddress ?? "Unknown"}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                No active sessions.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle role="heading" aria-level={2}>
              Linked accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.accounts.length ? (
              <ul className="space-y-2">
                {user.accounts.map((account, index) => (
                  <li
                    key={`${account.provider}-${index}`}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <span className="capitalize">{account.provider}</span>
                    <time
                      className="text-muted-foreground"
                      dateTime={account.linkedAt}
                    >
                      {formatDate(account.linkedAt)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">
                No linked accounts.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle role="heading" aria-level={2}>
              Recent audit entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.recentAudit.length ? (
              <ul className="space-y-2">
                {user.recentAudit.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap justify-between gap-2 text-sm"
                  >
                    <span>{entry.action}</span>
                    <time
                      className="text-muted-foreground"
                      dateTime={entry.createdAt}
                    >
                      {formatDateTime(entry.createdAt)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">
                No audit entries for this user.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function UserDetailPage(
  props: Parameters<typeof UserDetailPageContent>[0],
) {
  return (
    <Suspense fallback={<PageSkeleton title="User details" variant="cards" />}>
      <UserDetailPageContent {...props} />
    </Suspense>
  );
}
