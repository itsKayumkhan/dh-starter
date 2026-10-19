"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth/client";
import { MESSAGES } from "@/lib/constants/messages";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
});
type Values = z.infer<typeof schema>;
export function SignupForm() {
  const [message, setMessage] = useState("");
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const result = await authClient.signUp.email(values);
    setMessage(
      result.error
        ? (result.error.message ?? "Sign up failed.")
        : "Check your email to verify your account.",
    );
  });
  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            autoComplete="name"
            aria-invalid={Boolean(form.formState.errors.name)}
            {...form.register("name")}
          />
          <FieldError errors={[form.formState.errors.name]} />
        </Field>
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
            autoComplete="new-password"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
          <FieldError errors={[form.formState.errors.password]} />
        </Field>
        {message ? (
          <p role="status" className="text-sm">
            {message}
          </p>
        ) : null}
        <Button disabled={form.formState.isSubmitting} type="submit">
          {MESSAGES.createAccount}
        </Button>
      </FieldGroup>
    </form>
  );
}
