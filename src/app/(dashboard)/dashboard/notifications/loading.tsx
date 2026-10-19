import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
  return (
    <main
      className="mx-auto w-full max-w-4xl space-y-4 px-4 py-8 sm:px-6"
      aria-label="Loading notifications"
    >
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-36 w-full" />
    </main>
  );
}
