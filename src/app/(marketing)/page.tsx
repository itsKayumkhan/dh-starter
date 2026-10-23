import Link from "next/link";
import { Check, CircleHelp, Sparkles, Star } from "lucide-react";
import { getContent } from "@/lib/content/blocks";

export default async function HomePage() {
  const [hero, features, faq, testimonials] = await Promise.all([
    getContent("home.hero"),
    getContent("home.features"),
    getContent("home.faq"),
    getContent("home.testimonials"),
  ]);
  return (
    <main>
      <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-start justify-center gap-6 px-6">
        <p className="text-muted-foreground text-sm font-medium">
          {hero.eyebrow}
        </p>
        <h1 className="text-5xl font-semibold tracking-tight">{hero.title}</h1>
        <p className="text-muted-foreground max-w-xl text-lg">
          {hero.subtitle}
        </p>
        <Link
          className="bg-primary text-primary-foreground rounded-md px-5 py-3"
          href={hero.primary.href}
        >
          {hero.primary.label}
        </Link>
        {hero.secondary.label && hero.secondary.href ? (
          <Link className="text-sm underline" href={hero.secondary.href}>
            {hero.secondary.label}
          </Link>
        ) : null}
      </section>
      {features.items.length ? (
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-8 text-3xl font-semibold">{features.heading}</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {features.items.map((item, index) => (
              <article key={index} className="rounded-lg border p-5">
                {item.icon === "check" ? (
                  <Check
                    className="text-primary mb-4 size-5"
                    aria-hidden="true"
                  />
                ) : (
                  <Sparkles
                    className="text-primary mb-4 size-5"
                    aria-hidden="true"
                  />
                )}
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {testimonials.items.length ? (
        <section className="bg-muted/30 py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="mb-8 text-3xl font-semibold">
              {testimonials.heading}
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {testimonials.items.map((item, index) => (
                <blockquote
                  key={index}
                  className="bg-background rounded-lg border p-5"
                >
                  <Star
                    className="text-primary mb-4 size-5"
                    aria-hidden="true"
                  />
                  <p>{item.quote}</p>
                  <footer className="mt-4 flex items-center gap-3">
                    {item.avatar ? (
                      <span
                        aria-hidden="true"
                        className="size-9 rounded-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${JSON.stringify(item.avatar)})`,
                        }}
                      />
                    ) : null}
                    <span className="text-sm font-medium">
                      {item.name}
                      {item.role ? (
                        <span className="text-muted-foreground block font-normal">
                          {item.role}
                        </span>
                      ) : null}
                    </span>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      {faq.items.length ? (
        <section className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="mb-8 flex items-center gap-2 text-3xl font-semibold">
            <CircleHelp className="size-6" aria-hidden="true" /> {faq.heading}
          </h2>
          <div className="space-y-3">
            {faq.items.map((item, index) => (
              <details key={index} className="rounded-lg border p-5">
                <summary className="cursor-pointer font-medium">
                  {item.question}
                </summary>
                <p className="text-muted-foreground mt-3">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
