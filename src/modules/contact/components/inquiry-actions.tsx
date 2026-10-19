"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inquiryStatusSchema } from "@/modules/contact/schemas/inquiry";
import {
  changeInquiryStatus,
  resendInquiryNotification,
} from "@/modules/contact/server/actions";

const statusFormSchema = z.object({ status: inquiryStatusSchema });
type Values = z.infer<typeof statusFormSchema>;

export function InquiryActions({
  id,
  status,
  emailStatus,
}: {
  id: string;
  status: string;
  emailStatus: string;
}) {
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(statusFormSchema),
    defaultValues: {
      status: inquiryStatusSchema.safeParse(status).data ?? "new",
    },
  });

  const submit = form.handleSubmit(async (values) => {
    setError("");
    const result = await changeInquiryStatus({ id, ...values });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success("Inquiry status updated.");
  });

  async function resend() {
    setError("");
    setResending(true);
    try {
      const result = await resendInquiryNotification({ id });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Notification sent.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Controller
          control={form.control}
          name="status"
          render={({ field, fieldState }) => (
            <Field className="sm:max-w-56">
              <FieldLabel htmlFor="inquiry-status">Status</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="inquiry-status" className="w-full" aria-invalid={Boolean(fieldState.error)}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Save status"}
        </Button>
      </form>
      {emailStatus === "failed" ? (
        <div className="flex flex-col items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">Email delivery failed for this inquiry.</p>
          <Button type="button" variant="outline" onClick={resend} disabled={resending}>
            {resending ? "Resending..." : "Resend notification"}
          </Button>
        </div>
      ) : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
