"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ROUTES } from "@/lib/constants/routes";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { NOTIFICATION_MESSAGES } from "@/modules/notifications/messages";
import {
  adminSendSchema,
  type AdminSendInput,
} from "@/modules/notifications/schemas/notification";
import { adminSend } from "@/modules/notifications/server/actions";

export function SendNotificationForm({
  canReachAdmins,
}: {
  canReachAdmins: boolean;
}) {
  const [formError, setFormError] = useState("");
  const form = useForm<AdminSendInput>({
    resolver: zodResolver(adminSendSchema),
    defaultValues: {
      broadcastId: crypto.randomUUID(),
      target: "user",
      role: "user",
      userId: "",
      title: "",
      body: "",
      href: "",
      email: false,
    },
  });
  const target = useWatch({ control: form.control, name: "target" });

  const submit = form.handleSubmit(async (values) => {
    setFormError("");
    const result = await adminSend({
      ...values,
      href: values.href || undefined,
    });
    if (!result.ok) {
      setFormError(result.error);
      for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (key in values && messages[0]) {
          form.setError(key as keyof AdminSendInput, { message: messages[0] });
        }
      }
      return;
    }
    toast.success(
      `${result.data.created} notification${result.data.created === 1 ? "" : "s"} created.`,
    );
    if (result.data.emailFailed)
      toast.error(`${result.data.emailFailed} email deliveries failed.`);
    form.reset({
      broadcastId: crypto.randomUUID(),
      target: "user",
      role: "user",
      userId: "",
      title: "",
      body: "",
      href: "",
      email: false,
    });
  });

  return (
    <form
      onSubmit={submit}
      noValidate
      className="bg-card max-w-xl rounded-lg border p-4 sm:p-6"
    >
      <FieldGroup>
        <Controller
          control={form.control}
          name="target"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="notification-target">Recipients</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="notification-target" className="w-full">
                  <SelectValue placeholder="Choose recipients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">One user</SelectItem>
                  <SelectItem value="role">A role</SelectItem>
                  {canReachAdmins ? (
                    <SelectItem value="all">All users</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        {target === "user" ? (
          <Field data-invalid={Boolean(form.formState.errors.userId)}>
            <FieldLabel htmlFor="notification-user-id">User ID</FieldLabel>
            <Input
              id="notification-user-id"
              aria-invalid={Boolean(form.formState.errors.userId)}
              {...form.register("userId")}
            />
            <FieldError errors={[form.formState.errors.userId]} />
          </Field>
        ) : null}
        {target === "role" ? (
          <Controller
            control={form.control}
            name="role"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="notification-role">Role</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="notification-role" className="w-full">
                    <SelectValue placeholder="Choose a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    {canReachAdmins ? (
                      <SelectItem value="admin">Admin</SelectItem>
                    ) : null}
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        ) : null}
        <Field data-invalid={Boolean(form.formState.errors.title)}>
          <FieldLabel htmlFor="notification-title">Title</FieldLabel>
          <Input
            id="notification-title"
            maxLength={160}
            aria-invalid={Boolean(form.formState.errors.title)}
            {...form.register("title")}
          />
          <FieldError errors={[form.formState.errors.title]} />
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.body)}>
          <FieldLabel htmlFor="notification-body">Message</FieldLabel>
          <Textarea
            id="notification-body"
            rows={5}
            maxLength={2000}
            aria-invalid={Boolean(form.formState.errors.body)}
            {...form.register("body")}
          />
          <FieldError errors={[form.formState.errors.body]} />
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.href)}>
          <FieldLabel htmlFor="notification-href">Link (optional)</FieldLabel>
          <Input
            id="notification-href"
            placeholder={ROUTES.dashboard}
            aria-invalid={Boolean(form.formState.errors.href)}
            {...form.register("href")}
          />
          <FieldError errors={[form.formState.errors.href]} />
        </Field>
        <Controller
          control={form.control}
          name="email"
          render={({ field }) => (
            <Field orientation="horizontal" className="items-center">
              <Checkbox
                id="notification-email"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <FieldLabel htmlFor="notification-email">
                Also send email
              </FieldLabel>
            </Field>
          )}
        />
        {formError ? (
          <p role="alert" className="text-destructive text-sm">
            {formError}
          </p>
        ) : null}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? "Sending..."
            : NOTIFICATION_MESSAGES.send}
        </Button>
      </FieldGroup>
    </form>
  );
}
