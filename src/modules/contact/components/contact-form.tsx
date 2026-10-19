"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitInquirySchema } from "@/modules/contact/schemas/inquiry";
import { submitInquiry } from "@/modules/contact/server/actions";

type Values = z.input<typeof submitInquirySchema>;
type ValidatedValues = z.output<typeof submitInquirySchema>;

export function ContactForm({ formToken }: { formToken: string }) {
  const pathname = usePathname();
  const [formError, setFormError] = useState("");
  const [sent, setSent] = useState(false);
  const form = useForm<Values, unknown, ValidatedValues>({
    resolver: zodResolver(submitInquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      source: pathname,
      website: "",
      formToken,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError("");
    const result = await submitInquiry({ ...values, source: pathname });
    if (!result.ok) {
      for (const key of ["name", "email", "phone", "subject", "message"] as const) {
        const message = result.fieldErrors?.[key]?.[0];
        if (message) form.setError(key, { message });
      }
      setFormError(result.error);
      return;
    }
    setSent(true);
    form.reset({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      source: pathname,
      website: "",
      formToken,
    });
    toast.success("Your message has been sent.");
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <input type="hidden" {...form.register("source")} />
      <input type="hidden" {...form.register("formToken")} />
      <div className="absolute -left-[10000px]" aria-hidden="true">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input
          id="contact-website"
          tabIndex={-1}
          autoComplete="off"
          {...form.register("website")}
        />
      </div>
      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="contact-name">Name</FieldLabel>
            <Input
              id="contact-name"
              autoComplete="name"
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register("name")}
            />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="contact-email">Email</FieldLabel>
            <Input
              id="contact-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register("email")}
            />
            <FieldError errors={[form.formState.errors.email]} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="contact-phone">Phone (optional)</FieldLabel>
            <Input
              id="contact-phone"
              type="tel"
              autoComplete="tel"
              aria-invalid={Boolean(form.formState.errors.phone)}
              {...form.register("phone")}
            />
            <FieldError errors={[form.formState.errors.phone]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="contact-subject">Subject (optional)</FieldLabel>
            <Input
              id="contact-subject"
              aria-invalid={Boolean(form.formState.errors.subject)}
              {...form.register("subject")}
            />
            <FieldError errors={[form.formState.errors.subject]} />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="contact-message">Message</FieldLabel>
          <Textarea
            id="contact-message"
            rows={7}
            aria-invalid={Boolean(form.formState.errors.message)}
            {...form.register("message")}
          />
          <FieldError errors={[form.formState.errors.message]} />
        </Field>
      </FieldGroup>
      {formError ? <p role="alert" className="text-sm text-destructive">{formError}</p> : null}
      {sent ? <p role="status" className="text-sm text-foreground">Thanks, your inquiry has been received.</p> : null}
      <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
