import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";
import { site } from "@/config/site";
import { MESSAGES } from "@/lib/constants/messages";

export default function HomePage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-start justify-center gap-6 px-6">
      <p className="text-muted-foreground text-sm font-medium">{site.name}</p>
      <h1 className="text-5xl font-semibold tracking-tight">
        A solid start for your next project.
      </h1>
      <p className="text-muted-foreground max-w-xl text-lg">
        {site.description}
      </p>
      <Link
        className="bg-primary text-primary-foreground rounded-md px-5 py-3"
        href={ROUTES.signup}
      >
        {MESSAGES.getStarted}
      </Link>
    </section>
  );
}
