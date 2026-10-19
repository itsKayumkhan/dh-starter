"use client";

import { formatDateTime } from "@/lib/format";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Shield, UserRound, TriangleAlert } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTES } from "@/lib/constants/routes";
import {
  changeAccountPassword,
  deleteAccount,
  revokeAccountSession,
  revokeOtherAccountSessions,
  updateProfile,
} from "@/features/account/server/actions";
import type { AccountSession } from "@/features/account/server/sessions";
import {
  changePasswordSchema,
  deleteAccountSchema,
  profileSchema,
} from "@/features/account/schemas/account";

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof changePasswordSchema>;
type DeleteValues = z.infer<typeof deleteAccountSchema>;

export function AccountPanel({
  user,
  sessions,
  sessionsError,
}: {
  user: { name: string; email: string; imageUrl: string };
  sessions: AccountSession[];
  sessionsError: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Account"
        description="Manage your profile, password and active sessions."
      />
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-1">
          <TabsTrigger value="profile">
            <UserRound aria-hidden="true" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield aria-hidden="true" />
            Security
          </TabsTrigger>
          <TabsTrigger value="danger">
            <TriangleAlert aria-hidden="true" />
            Danger zone
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="pt-5">
          <ProfileForm user={user} />
        </TabsContent>
        <TabsContent value="security" className="space-y-6 pt-5">
          <PasswordForm />
          <SessionsList sessions={sessions} error={sessionsError} />
        </TabsContent>
        <TabsContent value="danger" className="pt-5">
          <DeleteAccountForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileForm({
  user,
}: {
  user: { name: string; email: string; imageUrl: string };
}) {
  const [formError, setFormError] = useState("");
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, imageUrl: user.imageUrl },
  });
  const submit = form.handleSubmit(async (values) => {
    setFormError("");
    const result = await updateProfile(values);
    if (!result.ok) {
      setFormError(result.error);
      if (result.fieldErrors?.name)
        form.setError("name", { message: result.fieldErrors.name[0] });
      if (result.fieldErrors?.imageUrl)
        form.setError("imageUrl", { message: result.fieldErrors.imageUrl[0] });
      return;
    }
    toast.success("Profile updated.");
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Choose how your name and photo appear.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="account-name">Name</FieldLabel>
              <Input
                id="account-name"
                autoComplete="name"
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register("name")}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="account-email">Email</FieldLabel>
              <Input
                id="account-email"
                type="email"
                value={user.email}
                disabled
                readOnly
              />
              <FieldDescription>
                Email changes are managed separately.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="account-image">Image URL</FieldLabel>
              <Input
                id="account-image"
                type="url"
                placeholder="https://example.com/photo.jpg"
                aria-invalid={Boolean(form.formState.errors.imageUrl)}
                {...form.register("imageUrl")}
              />
              <FieldDescription>
                Use a secure HTTPS image URL, or leave this blank.
              </FieldDescription>
              <FieldError errors={[form.formState.errors.imageUrl]} />
            </Field>
            {formError ? (
              <p role="alert" className="text-destructive text-sm">
                {formError}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-fit"
            >
              {form.formState.isSubmitting ? "Saving..." : "Save profile"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordForm() {
  const [formError, setFormError] = useState("");
  const form = useForm<PasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      revokeOtherSessions: false,
    },
  });
  const submit = form.handleSubmit(async (values) => {
    setFormError("");
    const result = await changeAccountPassword(values);
    if (!result.ok) {
      setFormError(result.error);
      if (result.fieldErrors?.currentPassword)
        form.setError("currentPassword", {
          message: result.fieldErrors.currentPassword[0],
        });
      if (result.fieldErrors?.newPassword)
        form.setError("newPassword", {
          message: result.fieldErrors.newPassword[0],
        });
      if (result.fieldErrors?.confirmPassword)
        form.setError("confirmPassword", {
          message: result.fieldErrors.confirmPassword[0],
        });
      return;
    }
    form.reset();
    toast.success("Password changed.");
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>
          Update your password and optionally sign out other devices.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="current-password">
                Current password
              </FieldLabel>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(form.formState.errors.currentPassword)}
                {...form.register("currentPassword")}
              />
              <FieldError errors={[form.formState.errors.currentPassword]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-password">New password</FieldLabel>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(form.formState.errors.newPassword)}
                {...form.register("newPassword")}
              />
              <FieldError errors={[form.formState.errors.newPassword]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-new-password">
                Confirm new password
              </FieldLabel>
              <Input
                id="confirm-new-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(form.formState.errors.confirmPassword)}
                {...form.register("confirmPassword")}
              />
              <FieldError errors={[form.formState.errors.confirmPassword]} />
            </Field>
            <Controller
              name="revokeOtherSessions"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal" className="items-center">
                  <Checkbox
                    id="password-revoke"
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                  <FieldLabel htmlFor="password-revoke">
                    Sign out all other devices
                  </FieldLabel>
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
              disabled={form.formState.isSubmitting}
              className="w-fit"
            >
              {form.formState.isSubmitting ? "Updating..." : "Change password"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

function SessionsList({
  sessions,
  error,
}: {
  sessions: AccountSession[];
  error: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState("");
  async function revoke(id: string) {
    setPending(id);
    const result = await revokeAccountSession({ id });
    setPending("");
    if (!result.ok) toast.error(result.error);
    else {
      toast.success("Session revoked.");
      router.refresh();
    }
  }
  async function revokeOthers() {
    setPending("all");
    const result = await revokeOtherAccountSessions({});
    setPending("");
    if (!result.ok) toast.error(result.error);
    else {
      toast.success("Other sessions revoked.");
      router.refresh();
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active sessions</CardTitle>
        <CardDescription>
          Review devices signed in to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            Sessions could not be loaded. Refresh this page to try again.
          </p>
        ) : sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No active sessions found.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium break-words">
                    {session.device}
                    {session.current ? " (this device)" : ""}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    IP: {session.ip} | Last active:{" "}
                    {formatDateTime(session.lastActive)}
                  </p>
                </div>
                {!session.current ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={Boolean(pending)}
                    onClick={() => revoke(session.id)}
                  >
                    {pending === session.id ? "Revoking..." : "Revoke"}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {!error && sessions.some((session) => !session.current) ? (
          <Button
            type="button"
            variant="outline"
            disabled={Boolean(pending)}
            onClick={revokeOthers}
          >
            {pending === "all" ? "Revoking..." : "Revoke all other sessions"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DeleteAccountForm() {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const form = useForm<DeleteValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: "" },
  });
  async function confirmDelete() {
    setPending(true);
    setFormError("");
    const result = await deleteAccount(form.getValues());
    setPending(false);
    if (!result.ok) {
      setFormError(result.error);
      if (result.fieldErrors?.password)
        form.setError("password", { message: result.fieldErrors.password[0] });
      return;
    }
    toast.success("Account deleted.");
    router.replace(ROUTES.home);
    router.refresh();
  }
  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle>Delete account</CardTitle>
        <CardDescription>
          This permanently removes your account and signs you out.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={form.handleSubmit(() => setReady(true))}
          noValidate
          className="space-y-4"
        >
          <Field>
            <FieldLabel htmlFor="delete-password">
              Confirm your password
            </FieldLabel>
            <Input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register("password")}
            />
            <FieldError errors={[form.formState.errors.password]} />
          </Field>
          <Button type="submit" variant="outline" disabled={pending}>
            Continue to confirmation
          </Button>
        </form>
        {formError ? (
          <p role="alert" className="text-destructive text-sm">
            {formError}
          </p>
        ) : null}
        {ready ? (
          <ConfirmDialog
            trigger={
              <Button type="button" variant="destructive" disabled={pending}>
                {pending ? "Deleting..." : "Delete account"}
              </Button>
            }
            title="Delete your account?"
            description="This action permanently removes your account. You cannot undo it."
            confirmLabel="Delete account"
            destructive
            onConfirm={confirmDelete}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
