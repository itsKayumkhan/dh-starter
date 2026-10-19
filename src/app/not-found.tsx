import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";
export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg p-12">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link className="mt-5 inline-block underline" href={ROUTES.home}>
        Go home
      </Link>
    </main>
  );
}
