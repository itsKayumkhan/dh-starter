"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  contentRegistry,
  type ContentField,
  type ContentKey,
} from "@/config/content";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  emptyItem,
  fieldsForItem,
  moveItem,
} from "@/modules/cms/components/field-mapping";
import { resetBlock, saveBlock } from "@/modules/cms/server/actions";

type Values = { value: Record<string, unknown> };

function fieldError(errors: unknown, path: string): string | undefined {
  let node: unknown = errors;
  for (const part of path.split(".")) {
    if (!node || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node && typeof node === "object"
    ? (node as { message?: string }).message
    : undefined;
}

export function BlockForm({
  blockKey,
  initialValue,
}: {
  blockKey: ContentKey;
  initialValue: Record<string, unknown>;
}) {
  const router = useRouter();
  const block = contentRegistry[blockKey];
  const [message, setMessage] = useState("");
  const resolverSchema = z
    .object({ value: z.record(z.string(), z.unknown()) })
    .superRefine((input, ctx) => {
      const parsed = block.schema.safeParse(input.value);
      if (!parsed.success)
        for (const issue of parsed.error.issues)
          ctx.addIssue({
            code: "custom",
            message: issue.message,
            path: ["value", ...issue.path],
          });
    });
  const form = useForm<Values>({
    resolver: zodResolver(resolverSchema),
    defaultValues: { value: initialValue },
  });
  const preview =
    useWatch({ control: form.control, name: "value" }) ?? initialValue;

  function renderField(field: ContentField, name: string) {
    const path = `value.${name}` as FieldPath<Values>;
    const error = fieldError(form.formState.errors, path);
    return (
      <Field key={name}>
        <FieldLabel htmlFor={`cms-${name}`}>{field.label}</FieldLabel>
        {field.type === "textarea" ? (
          <Textarea
            id={`cms-${name}`}
            aria-invalid={Boolean(error)}
            {...form.register(path)}
          />
        ) : field.type === "boolean" ? (
          <input id={`cms-${name}`} type="checkbox" {...form.register(path)} />
        ) : (
          <Input
            id={`cms-${name}`}
            type={field.type === "url" ? "text" : "text"}
            aria-invalid={Boolean(error)}
            {...form.register(path)}
          />
        )}
        {field.type === "image" ? (
          <p className="text-muted-foreground text-xs">
            Enter a public image URL. Upload integration can be added per
            project.
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
      </Field>
    );
  }

  function listItems(name: string): Record<string, unknown>[] {
    const value = form.getValues(`value.${name}` as FieldPath<Values>);
    return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
  }

  function changeList(name: string, next: Record<string, unknown>[]) {
    form.setValue(`value.${name}` as FieldPath<Values>, next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  const submit = form.handleSubmit(async ({ value }) => {
    setMessage("");
    const result = await saveBlock({ key: blockKey, value });
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    toast.success("Content saved");
    form.reset({ value });
    router.refresh();
  });

  async function reset() {
    setMessage("");
    const result = await resetBlock({ key: blockKey });
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    form.reset({
      value: structuredClone(block.defaultValue) as Record<string, unknown>,
    });
    toast.success("Default content restored");
    router.refresh();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {block.fields.map((field) => {
        if (field.type !== "list") return renderField(field, field.name);
        const items = Array.isArray(preview[field.name])
          ? (preview[field.name] as Record<string, unknown>[])
          : [];
        return (
          <Field key={field.name}>
            <FieldLabel>{field.label}</FieldLabel>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="space-y-3 rounded-lg border p-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={index === 0}
                      onClick={() =>
                        changeList(
                          field.name,
                          moveItem(listItems(field.name), index, -1),
                        )
                      }
                    >
                      Move up
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={index === items.length - 1}
                      onClick={() =>
                        changeList(
                          field.name,
                          moveItem(listItems(field.name), index, 1),
                        )
                      }
                    >
                      Move down
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        changeList(
                          field.name,
                          listItems(field.name).filter(
                            (_, position) => position !== index,
                          ),
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                  {fieldsForItem(
                    field.fields ?? [],
                    `${field.name}.${index}`,
                  ).map(({ path, field: subfield }) =>
                    renderField(subfield, path),
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                changeList(field.name, [
                  ...listItems(field.name),
                  emptyItem(field.fields ?? []),
                ])
              }
            >
              Add {field.label.toLowerCase()}
            </Button>
          </Field>
        );
      })}
      {message ? (
        <p role="alert" className="text-destructive text-sm">
          {message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Save block
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={form.formState.isSubmitting}
          onClick={() => void reset()}
        >
          Reset to default
        </Button>
      </div>
      <details>
        <summary className="cursor-pointer text-sm">Preview value</summary>
        <pre className="bg-muted mt-2 overflow-auto rounded p-4 text-xs">
          {JSON.stringify(preview, null, 2)}
        </pre>
      </details>
    </form>
  );
}
