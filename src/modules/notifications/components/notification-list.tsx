"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { NOTIFICATION_MESSAGES } from "@/modules/notifications/messages";
import {
  deleteNotification,
  markAllRead,
  markRead,
} from "@/modules/notifications/server/actions";
import type { NotificationDto } from "@/modules/notifications/server/queries";

export function NotificationList({
  items,
  unread,
}: {
  items: NotificationDto[];
  unread: number;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();

  function markOne(id: string) {
    startTransition(async () => {
      const result = await markRead(id);
      if (!result.ok) toast.error(result.error);
      else {
        await queryClient.invalidateQueries({ queryKey: ["notifications"] });
        router.refresh();
      }
    });
  }

  function markAll() {
    startTransition(async () => {
      const result = await markAllRead();
      if (!result.ok) toast.error(result.error);
      else {
        await queryClient.invalidateQueries({ queryKey: ["notifications"] });
        router.refresh();
      }
    });
  }

  async function remove(id: string) {
    const result = await deleteNotification(id);
    if (!result.ok) toast.error(result.error);
    else {
      toast.success("Notification deleted.");
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {unread > 0 ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={markAll}
        >
          {NOTIFICATION_MESSAGES.markAllRead}
        </Button>
      ) : null}
      {items.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border p-8 text-center">
          {NOTIFICATION_MESSAGES.empty}
        </p>
      ) : null}
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="bg-card rounded-lg border p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <h2 className="flex items-center gap-2 font-semibold">
                  {!item.readAt ? (
                    <span
                      className="bg-primary size-2 shrink-0 rounded-full"
                      aria-label="Unread"
                    />
                  ) : null}
                  {item.title}
                </h2>
                <p className="text-muted-foreground text-sm break-words">
                  {item.body}
                </p>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-primary focus-visible:ring-ring inline-block rounded text-sm underline-offset-4 hover:underline focus-visible:ring-2"
                  >
                    Open link
                  </Link>
                ) : null}
              </div>
              <time
                dateTime={item.createdAt}
                className="text-muted-foreground shrink-0 text-xs"
              >
                {item.createdAt.slice(0, 10)}
              </time>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {!item.readAt ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => markOne(item.id)}
                >
                  <Check aria-hidden="true" />
                  {NOTIFICATION_MESSAGES.markRead}
                </Button>
              ) : null}
              <ConfirmDialog
                trigger={
                  <Button variant="ghost" size="sm" disabled={pending}>
                    <Trash2 aria-hidden="true" />
                    {NOTIFICATION_MESSAGES.delete}
                  </Button>
                }
                title="Delete notification?"
                description="This notification will be removed from your list."
                confirmLabel={NOTIFICATION_MESSAGES.delete}
                destructive
                onConfirm={() => remove(item.id)}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
