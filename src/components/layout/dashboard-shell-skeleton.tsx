import { site } from "@/config/site";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardShellSkeleton() {
  return (
    <div className="flex min-h-screen w-full" aria-busy="true">
      <aside className="hidden w-64 shrink-0 space-y-8 border-r bg-background p-4 md:block">
        <div className="flex items-center gap-2 font-semibold"><span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">DH</span>{site.name}</div>
        <div className="space-y-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
        <div className="space-y-3"><Skeleton className="h-4 w-20" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
      </aside>
      <div className="min-w-0 flex-1"><header className="flex h-14 items-center gap-3 border-b px-4"><Skeleton className="size-7" /><Skeleton className="h-4 w-40" /></header><PageSkeleton /></div>
    </div>
  );
}
