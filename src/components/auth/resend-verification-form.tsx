"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authClient } from "@/lib/auth/client";
import { AUTH_ROUTES } from "@/components/auth/routes";
import { emailOnlySchema } from "@/components/auth/schemas";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Values = z.infer<typeof emailOnlySchema>;

export function ResendVerificationForm({
  initialEmail = "",
  message,
}: {
  initialEmail?: string;
  message?: string;
}) {
  const [sent, setSent] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: initialEmail },
  });
  const submit = form.handleSubmit(async ({ email }) => {
    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: AUTH_ROUTES.verifyEmailSuccess,
      });
    } catch {
      setSent(true);
      return;
    }
    setSent(true);
  });
  return (
    <div className="bg-muted/30 space-y-3 rounded-lg border p-4">
      {message ? (
        <p role="alert" className="text-sm">
          {message}
        </p>
      ) : null}
      {sent ? (
        <p role="status" className="text-sm">
          If this address can receive a verification link, check its inbox.
        </p>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-3">
          <Field>
            <FieldLabel htmlFor="resend-email">Email</FieldLabel>
            <Input
              id="resend-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register("email")}
            />
            <FieldError errors={[form.formState.errors.email]} />
          </Field>
          <Button
            type="submit"
            variant="outline"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? "Sending..."
              : "Resend verification email"}
          </Button>
        </form>
      )}
    </div>
  );
}
