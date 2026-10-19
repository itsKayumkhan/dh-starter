import { requireRole } from "@/lib/auth/session";
export default async function AdminPage() {
  await requireRole(["admin"]);
  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-semibold">Admin</h1>
    </main>
  );
}
