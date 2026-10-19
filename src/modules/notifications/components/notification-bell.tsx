"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { markAllRead } from "@/modules/notifications/server/actions";
import { NOTIFICATION_MESSAGES } from "@/modules/notifications/messages";
import { NOTIFICATION_ROUTES } from "@/modules/notifications/routes";

const summarySchema = z.object({
  unread: z.number().int().nonnegative(),
  latest: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        body: z.string(),
        href: z.string().nullable(),
        readAt: z.string().nullable(),
        createdAt: z.string(),
      }),
    )
    .max(5),
});

async function fetchSummary() {
  const response = await fetch(NOTIFICATION_ROUTES.summary, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(NOTIFICATION_MESSAGES.unavailable);
  return summarySchema.parse(await response.json());
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const summary = useQuery({
    queryKey: ["notifications", "summary"],
    queryFn: fetchSummary,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const unread = summary.data?.unread ?? 0;

  function markAll() {
    startTransition(async () => {
      const result = await markAllRead();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read.");
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${NOTIFICATION_MESSAGES.title}${unread ? `, ${unread} unread` : ""}`}
        >
          <span className="relative">
            <Bell className="size-5" aria-hidden="true" />
            {unread > 0 ? (
              <span
                className="bg-primary text-primary-foreground absolute -top-2 -right-2 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px]"
                aria-hidden="true"
              >
                {unread > 99 ? "99+" : unread}
              </span>
            ) : null}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(22rem,calc(100vw-1.5rem))] p-3"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">{NOTIFICATION_MESSAGES.title}</h2>
          {unread > 0 ? (
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={markAll}
            >
              {NOTIFICATION_MESSAGES.markAllRead}
            </Button>
          ) : null}
        </div>
        {summary.isPending ? (
          <p className="text-muted-foreground py-4 text-sm" role="status">
            Loading notifications...
          </p>
        ) : null}
        {summary.isError ? (
          <div role="alert" className="space-y-2 py-3 text-sm">
            <p>{NOTIFICATION_MESSAGES.unavailable}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => summary.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : null}
        {summary.data?.latest.length === 0 ? (
          <p className="text-muted-foreground py-4 text-sm">
            {NOTIFICATION_MESSAGES.empty}
          </p>
        ) : null}
        {summary.data?.latest.map((item) => (
          <Link
            key={item.id}
            href={item.href ?? NOTIFICATION_ROUTES.list}
            onClick={() => setOpen(false)}
            className="hover:bg-accent focus-visible:ring-ring block rounded-md px-2 py-2 outline-none focus-visible:ring-2"
          >
            <span className="flex items-center gap-2 font-medium">
              {!item.readAt ? (
                <span
                  className="bg-primary size-1.5 rounded-full"
                  aria-label="Unread"
                />
              ) : null}
              {item.title}
            </span>
            <span className="text-muted-foreground mt-1 line-clamp-2 block text-xs">
              {item.body}
            </span>
          </Link>
        ))}
        <Link
          href={NOTIFICATION_ROUTES.list}
          onClick={() => setOpen(false)}
          className="text-primary focus-visible:ring-ring mt-2 block rounded-md px-2 py-2 text-center text-sm font-medium focus-visible:ring-2"
        >
          View all notifications
        </Link>
      </PopoverContent>
    </Popover>
  );
}
