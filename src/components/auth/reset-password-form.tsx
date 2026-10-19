"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/lib/auth/client";
import { ROUTES } from "@/lib/constants/routes";
import { AUTH_ROUTES } from "@/components/auth/routes";
import { resetPasswordSchema } from "@/components/auth/schemas";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Values = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm({
  token,
  invalid,
}: {
  token?: string;
  invalid: boolean;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const form = useForm<Values>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const submit = form.handleSubmit(async ({ password }) => {
    if (!token) return;
    setFormError("");
    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (!result.error) {
        toast.success("Password updated. Sign in with your new password.");
        router.replace(ROUTES.login);
        return;
      }
    } catch {
      setFormError("This reset link could not be used. Request a new one.");
      return;
    }
    setFormError("This reset link could not be used. Request a new one.");
  });
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Choose a new password</h1>
        <p className="text-muted-foreground text-sm">
          Use at least 8 characters.
        </p>
      </div>
      {!token || invalid ? (
        <p
          role="alert"
          className="border-destructive/30 text-destructive rounded-lg border p-4 text-sm"
        >
          This reset link is missing or expired.{" "}
          <Link href={AUTH_ROUTES.forgotPassword} className="underline">
            Request a new link
          </Link>
          .
        </p>
      ) : (
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="reset-password">New password</FieldLabel>
              <Input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register("password")}
              />
              <FieldError errors={[form.formState.errors.password]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="reset-confirm">
                Confirm new password
              </FieldLabel>
              <Input
                id="reset-confirm"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(form.formState.errors.confirmPassword)}
                {...form.register("confirmPassword")}
              />
              <FieldError errors={[form.formState.errors.confirmPassword]} />
            </Field>
            {formError ? (
              <p role="alert" className="text-destructive text-sm">
                {formError}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full"
            >
              {form.formState.isSubmitting ? "Updating..." : "Update password"}
            </Button>
          </FieldGroup>
        </form>
      )}
    </div>
  );
}
