"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import {
  settingsDefaults,
  settingsSchema,
  type SiteSettings,
} from "@/config/settings";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveSettings } from "@/modules/cms/server/actions";

const fields = [
  { name: "name", label: "Site name", type: "text", group: "Brand" },
  {
    name: "description",
    label: "Site description",
    type: "textarea",
    group: "Brand",
  },
  { name: "url", label: "Site URL", type: "url", group: "Brand" },
  { name: "logo", label: "Logo image URL", type: "text", group: "Brand" },
  { name: "colors.primary", label: "Primary", type: "color", group: "Colors" },
  {
    name: "colors.background",
    label: "Background",
    type: "color",
    group: "Colors",
  },
  {
    name: "colors.foreground",
    label: "Foreground",
    type: "color",
    group: "Colors",
  },
  { name: "colors.muted", label: "Muted", type: "color", group: "Colors" },
  {
    name: "supportEmail",
    label: "Support email",
    type: "email",
    group: "Contact",
  },
  { name: "address", label: "Address", type: "textarea", group: "Contact" },
  { name: "social.website", label: "Website", type: "url", group: "Social" },
  {
    name: "social.instagram",
    label: "Instagram",
    type: "url",
    group: "Social",
  },
  { name: "social.linkedin", label: "LinkedIn", type: "url", group: "Social" },
  { name: "social.x", label: "X", type: "url", group: "Social" },
  {
    name: "seo.titleTemplate",
    label: "SEO title template",
    type: "text",
    group: "SEO",
  },
  {
    name: "seo.description",
    label: "Default SEO description",
    type: "textarea",
    group: "SEO",
  },
] as const satisfies {
  name: FieldPath<SiteSettings>;
  label: string;
  type: string;
  group: string;
}[];

function atPath(value: object, path: string): string {
  return path
    .split(".")
    .reduce<unknown>(
      (current, part) =>
        current && typeof current === "object"
          ? (current as Record<string, unknown>)[part]
          : undefined,
      value,
    ) as string;
}

export function SettingsForm({ initialValue }: { initialValue: SiteSettings }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const form = useForm<SiteSettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialValue,
  });
  const submit = form.handleSubmit(async (value) => {
    setMessage("");
    const result = await saveSettings(value);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    toast.success("Site settings saved");
    form.reset(value);
    router.refresh();
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-8">
      {["Brand", "Colors", "Contact", "Social", "SEO"].map((group) => (
        <section key={group} className="space-y-4 rounded-lg border p-5">
          <h2 className="text-lg font-semibold">{group}</h2>
          {fields
            .filter((field) => field.group === group)
            .map((field) => {
              const error = field.name
                .split(".")
                .reduce<unknown>(
                  (current, part) =>
                    current && typeof current === "object"
                      ? (current as Record<string, unknown>)[part]
                      : undefined,
                  form.formState.errors,
                );
              const errorText =
                error && typeof error === "object"
                  ? (error as { message?: string }).message
                  : undefined;
              return (
                <Field key={field.name}>
                  <div className="flex items-center justify-between gap-2">
                    <FieldLabel htmlFor={`setting-${field.name}`}>
                      {field.label}
                    </FieldLabel>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        form.setValue(
                          field.name,
                          atPath(settingsDefaults, field.name),
                          { shouldDirty: true, shouldValidate: true },
                        )
                      }
                    >
                      Reset to default
                    </Button>
                  </div>
                  {field.type === "textarea" ? (
                    <Textarea
                      id={`setting-${field.name}`}
                      aria-invalid={Boolean(errorText)}
                      {...form.register(field.name)}
                    />
                  ) : (
                    <Input
                      id={`setting-${field.name}`}
                      type={field.type}
                      aria-invalid={Boolean(errorText)}
                      {...form.register(field.name)}
                    />
                  )}
                  {field.name === "logo" ? (
                    <p className="text-muted-foreground text-xs">
                      Enter a public image URL. Upload integration can be added
                      per project.
                    </p>
                  ) : null}
                  {errorText ? (
                    <p role="alert" className="text-destructive text-sm">
                      {errorText}
                    </p>
                  ) : null}
                </Field>
              );
            })}
        </section>
      ))}
      {message ? (
        <p role="alert" className="text-destructive text-sm">
          {message}
        </p>
      ) : null}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        Save settings
      </Button>
    </form>
  );
}
