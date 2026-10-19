import { Skeleton } from "@/components/ui/skeleton";

export default function AdminBillingLoading() {
  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6" aria-label="Loading payments">
    <Skeleton className="h-9 w-52" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-64 w-full" />
  </main>;
}
