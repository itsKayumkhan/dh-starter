"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/lib/auth/client";
import { ROUTES } from "@/lib/constants/routes";
import { MESSAGES } from "@/lib/constants/messages";
import { AUTH_ROUTES } from "@/components/auth/routes";
import { loginSchema } from "@/components/auth/schemas";
import { sanitizeNext } from "@/components/auth/safe-redirect";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Values = z.infer<typeof loginSchema>;

export function LoginForm({
  next,
  googleEnabled,
  oauthError,
}: {
  next: string;
  googleEnabled: boolean;
  oauthError: boolean;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [googlePending, setGooglePending] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });
  const destination = sanitizeNext(next);

  const submit = form.handleSubmit(async (values) => {
    setFormError("");
    setUnverifiedEmail("");
    try {
      const result = await authClient.signIn.email(values);
      if (result.error) {
        if (result.error.code === "EMAIL_NOT_VERIFIED")
          setUnverifiedEmail(values.email);
        else setFormError(result.error.message ?? "Unable to sign in.");
        return;
      }
      router.replace(destination);
      router.refresh();
    } catch {
      setFormError("Unable to sign in. Try again.");
    }
  });

  async function signInWithGoogle() {
    setGooglePending(true);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: destination,
        errorCallbackURL: ROUTES.login,
      });
      if (!result.error) return;
      toast.error("Google sign in could not start.");
    } catch {
      toast.error("Google sign in could not start.");
    }
    setGooglePending(false);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {MESSAGES.signIn}
        </h1>
        <p className="text-muted-foreground text-sm">
          Welcome back to your account.
        </p>
      </div>
      {oauthError ? (
        <p role="alert" className="text-destructive text-sm">
          Google sign in could not be completed. Please try again.
        </p>
      ) : null}
      {unverifiedEmail ? (
        <ResendVerificationForm
          initialEmail={unverifiedEmail}
          message="Please verify your email before signing in."
        />
      ) : null}
      <form onSubmit={submit} noValidate>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="login-email">Email</FieldLabel>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register("email")}
            />
            <FieldError errors={[form.formState.errors.email]} />
          </Field>
          <Field>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel htmlFor="login-password">Password</FieldLabel>
              <Link
                href={AUTH_ROUTES.forgotPassword}
                className="text-primary text-sm underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register("password")}
            />
            <FieldError errors={[form.formState.errors.password]} />
          </Field>
          <Controller
            name="rememberMe"
            control={form.control}
            render={({ field }) => (
              <Field orientation="horizontal" className="items-center">
                <Checkbox
                  id="remember-me"
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
                <FieldLabel htmlFor="remember-me">Remember me</FieldLabel>
              </Field>
            )}
          />
          {formError ? (
            <p role="alert" className="text-destructive text-sm">
              {formError}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || googlePending}
            className="w-full"
          >
            {form.formState.isSubmitting ? "Signing in..." : MESSAGES.signIn}
          </Button>
        </FieldGroup>
      </form>
      {googleEnabled ? (
        <Button
          type="button"
          variant="outline"
          disabled={googlePending || form.formState.isSubmitting}
          className="w-full"
          onClick={signInWithGoogle}
        >
          {googlePending ? "Connecting..." : "Continue with Google"}
        </Button>
      ) : null}
      <p className="text-muted-foreground text-center text-sm">
        New here?{" "}
        <Link
          href={ROUTES.signup}
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
