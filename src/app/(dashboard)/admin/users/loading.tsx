import { Skeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
  return <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-8" aria-label="Loading users"><Skeleton className="h-10 w-48" /><Skeleton className="h-12 w-full" /><Skeleton className="h-80 w-full" /></main>;
}
