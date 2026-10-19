"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authClient } from "@/lib/auth/client";
import { ROUTES } from "@/lib/constants/routes";
import { AUTH_ROUTES } from "@/components/auth/routes";
import { emailOnlySchema } from "@/components/auth/schemas";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Values = z.infer<typeof emailOnlySchema>;

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: "" },
  });
  const submit = form.handleSubmit(async ({ email }) => {
    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: AUTH_ROUTES.resetPassword,
      });
    } catch {
      setSent(true);
      return;
    }
    setSent(true);
  });
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Reset your password</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email address for a reset link.
        </p>
      </div>
      {sent ? (
        <p role="status" className="bg-muted/30 rounded-lg border p-4 text-sm">
          If an account exists for this email, a reset link is on its way.
        </p>
      ) : (
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(form.formState.errors.email)}
                {...form.register("email")}
              />
              <FieldError errors={[form.formState.errors.email]} />
            </Field>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full"
            >
              {form.formState.isSubmitting ? "Sending..." : "Send reset link"}
            </Button>
          </FieldGroup>
        </form>
      )}
      <p className="text-center text-sm">
        <Link
          href={ROUTES.login}
          className="text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
