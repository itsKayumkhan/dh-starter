import { Skeleton } from "@/components/ui/skeleton";

export default function BillingLoading() {
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6" aria-label="Loading billing">
    <Skeleton className="h-9 w-40" />
    <Skeleton className="h-40 w-full" />
    <Skeleton className="h-32 w-full" />
  </main>;
}
