"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth/client";
import { ROUTES } from "@/lib/constants/routes";
import { MESSAGES } from "@/lib/constants/messages";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({ email: z.email(), password: z.string().min(8) });
type Values = z.infer<typeof schema>;
export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });
  const submit = form.handleSubmit(async (values) => {
    setFormError("");
    const result = await authClient.signIn.email(values);
    if (result.error) {
      setFormError(result.error.message ?? "Sign in failed.");
      return;
    }
    router.push(next ?? ROUTES.dashboard);
    router.refresh();
  });
  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
          <FieldError errors={[form.formState.errors.password]} />
        </Field>
        {formError ? (
          <p role="alert" className="text-destructive text-sm">
            {formError}
          </p>
        ) : null}
        <Button disabled={form.formState.isSubmitting} type="submit">
          {MESSAGES.signIn}
        </Button>
      </FieldGroup>
    </form>
  );
}
