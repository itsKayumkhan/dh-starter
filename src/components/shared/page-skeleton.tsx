import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton({ title, variant = "table" }: { title?: string; variant?: "table" | "form" | "cards" }) {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-8" aria-busy="true">
      <div className="space-y-2">
        {title ? <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1> : <Skeleton className="h-9 w-48" />}
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {variant === "form" ? <div className="max-w-md space-y-5 rounded-xl border p-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-10 w-full" /></div>
        : variant === "cards" ? <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-56 w-full" /><Skeleton className="h-56 w-full" /><Skeleton className="h-56 w-full" /><Skeleton className="h-56 w-full" /></div>
          : <><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></>}
    </main>
  );
}
