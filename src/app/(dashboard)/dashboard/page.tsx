import { requireUser } from "@/lib/auth/session";
export default async function DashboardPage() {
  const user = await requireUser();
  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground mt-4">Welcome, {user.name}.</p>
    </main>
  );
}
