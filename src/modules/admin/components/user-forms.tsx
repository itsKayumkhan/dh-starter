"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { banUser, changeRole, deleteUser, inviteUser, revokeUserSessions, unbanUser } from "@/modules/admin/server/actions";
import { banUserSchema, changeRoleSchema, inviteUserSchema } from "@/modules/admin/schemas/admin";
import { ADMIN_ROUTES } from "@/modules/admin/routes";

function applyErrors(form: { setError: (name: never, error: { message: string }) => void }, errors?: Record<string, string[]>) {
  for (const [key, messages] of Object.entries(errors ?? {})) {
    form.setError(key as never, { message: messages[0] ?? "Invalid value" });
  }
}

type InviteValues = z.input<typeof inviteUserSchema>;
export function InviteUserDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<InviteValues>({ resolver: zodResolver(inviteUserSchema), defaultValues: { name: "", email: "", role: "user" } });
  const submit = form.handleSubmit(async (values) => {
    setError("");
    const result = await inviteUser(values);
    if (!result.ok) {
      setError(result.error);
      applyErrors(form, result.fieldErrors);
      return;
    }
    toast.success("Invitation sent");
    form.reset();
    setOpen(false);
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><UserPlus className="size-4" /> Invite user</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Invite user</DialogTitle><DialogDescription>Send a link to set a password.</DialogDescription></DialogHeader>
        <form onSubmit={submit} noValidate>
          <FieldGroup>
            <Field><FieldLabel htmlFor="invite-name">Name</FieldLabel><Input id="invite-name" autoComplete="name" aria-invalid={Boolean(form.formState.errors.name)} {...form.register("name")} /><FieldError errors={[form.formState.errors.name]} /></Field>
            <Field><FieldLabel htmlFor="invite-email">Email</FieldLabel><Input id="invite-email" type="email" autoComplete="email" aria-invalid={Boolean(form.formState.errors.email)} {...form.register("email")} /><FieldError errors={[form.formState.errors.email]} /></Field>
            <Field><FieldLabel htmlFor="invite-role">Role</FieldLabel><Controller name="role" control={form.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger id="invite-role" aria-invalid={Boolean(form.formState.errors.role)}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="staff">Staff</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select>} /><FieldError errors={[form.formState.errors.role]} /></Field>
            {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
            <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Sending..." : "Send invitation"}</Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type RoleValues = z.input<typeof changeRoleSchema>;
export function RoleForm({ id, role, disabled }: { id: string; role: string; disabled: boolean }) {
  const [error, setError] = useState("");
  const form = useForm<RoleValues>({ resolver: zodResolver(changeRoleSchema), defaultValues: { id, role: role === "staff" || role === "admin" ? role : "user" } });
  const submit = form.handleSubmit(async (values) => {
    setError("");
    const result = await changeRole(values);
    if (!result.ok) { setError(result.error); applyErrors(form, result.fieldErrors); return; }
    toast.success("Role updated");
  });
  return <form onSubmit={submit} className="space-y-3"><Field><FieldLabel htmlFor="user-role">Role</FieldLabel><Controller name="role" control={form.control} render={({ field }) => <Select value={field.value} onValueChange={field.onChange} disabled={disabled || form.formState.isSubmitting}><SelectTrigger id="user-role"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="staff">Staff</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select>} /><FieldError errors={[form.formState.errors.role]} /></Field>{error && <p role="alert" className="text-destructive text-sm">{error}</p>}<Button type="submit" disabled={disabled || form.formState.isSubmitting || !form.formState.isDirty}>Save role</Button></form>;
}

type BanValues = z.input<typeof banUserSchema>;
export function BanForm({ id }: { id: string }) {
  const [error, setError] = useState("");
  const form = useForm<BanValues>({ resolver: zodResolver(banUserSchema), defaultValues: { id, reason: "", expiresAt: undefined } });
  const submit = form.handleSubmit(async (values) => {
    setError("");
    const result = await banUser(values);
    if (!result.ok) { setError(result.error); applyErrors(form, result.fieldErrors); return; }
    toast.success("User banned");
    form.reset();
  });
  return <form onSubmit={submit} className="space-y-4" noValidate>
    <Field><FieldLabel htmlFor="ban-reason">Reason</FieldLabel><Textarea id="ban-reason" aria-invalid={Boolean(form.formState.errors.reason)} {...form.register("reason")} /><FieldError errors={[form.formState.errors.reason]} /></Field>
    <Field><FieldLabel htmlFor="ban-expiry">Expiry (optional)</FieldLabel><Input id="ban-expiry" type="datetime-local" aria-invalid={Boolean(form.formState.errors.expiresAt)} onChange={(event) => form.setValue("expiresAt", event.target.value ? new Date(event.target.value).toISOString() : undefined, { shouldValidate: true })} /><FieldError errors={[form.formState.errors.expiresAt]} /></Field>
    {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
    <Button variant="destructive" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Banning..." : "Ban user"}</Button>
  </form>;
}

export function UserDangerActions({ id, banned, isSelf }: { id: string; banned: boolean; isSelf: boolean }) {
  const router = useRouter();
  async function perform(action: typeof unbanUser | typeof revokeUserSessions | typeof deleteUser, success: string, leave = false) {
    const result = await action({ id });
    if (!result.ok) { toast.error(result.error); return; }
    toast.success(success);
    if (leave) router.push(ADMIN_ROUTES.users);
  }
  return <div className="flex flex-wrap gap-2">
    {banned && <Button variant="outline" onClick={() => void perform(unbanUser, "User unbanned")}>Unban user</Button>}
    <ConfirmDialog trigger={<Button variant="outline">Revoke sessions</Button>} title="Revoke all sessions?" description="This user will need to sign in again." onConfirm={() => perform(revokeUserSessions, "Sessions revoked")} />
    <ConfirmDialog trigger={<Button variant="destructive" disabled={isSelf}>Delete user</Button>} title="Delete user?" description="This permanently deletes the user, accounts and sessions." confirmLabel="Delete user" destructive onConfirm={() => perform(deleteUser, "User deleted", true)} />
  </div>;
}
