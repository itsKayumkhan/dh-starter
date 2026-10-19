import { Skeleton } from "@/components/ui/skeleton";

export default function AdminNotificationsLoading() {
  return (
    <main
      className="mx-auto w-full max-w-4xl space-y-4 px-4 py-8 sm:px-6"
      aria-label="Loading notification form"
    >
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-96 w-full max-w-xl" />
    </main>
  );
}
