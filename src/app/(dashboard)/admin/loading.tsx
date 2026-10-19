import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return <div className="space-y-6" role="status" aria-label="Loading admin overview">
    <Skeleton className="h-9 w-64 max-w-full" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-32" />)}</div>
    <Skeleton className="h-40 w-full" />
    <span className="sr-only">Loading admin overview</span>
  </div>;
}
