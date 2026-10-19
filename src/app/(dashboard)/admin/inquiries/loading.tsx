export default function InquiriesLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6" aria-busy="true">
      <div className="h-9 w-48 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
      <div className="h-72 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
      <span className="sr-only">Loading inquiries</span>
    </main>
  );
}
