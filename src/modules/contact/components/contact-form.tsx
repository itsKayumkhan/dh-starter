"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useContactForm } from "@/modules/contact/components/use-contact-form";

export function ContactForm({ formToken }: { formToken: string }) {
  const { form, onSubmit, isPending, fieldErrors, formError, result } =
    useContactForm({ formToken });

  return (
    <form onSubmit={onSubmit} noValidate>
      <input type="hidden" {...form.register("source")} />
      <input type="hidden" {...form.register("formToken")} />
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-10000px" }}
      >
        <label htmlFor="contact-website">Leave this field empty</label>
        <input
          id="contact-website"
          tabIndex={-1}
          autoComplete="off"
          {...form.register("website")}
        />
      </div>
      <Field>
        <FieldLabel htmlFor="contact-name">Name</FieldLabel>
        <Input
          id="contact-name"
          autoComplete="name"
          aria-invalid={Boolean(fieldErrors.name)}
          {...form.register("name")}
        />
        <FieldError errors={[fieldErrors.name]} />
      </Field>
      <Field>
        <FieldLabel htmlFor="contact-email">Email</FieldLabel>
        <Input
          id="contact-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email)}
          {...form.register("email")}
        />
        <FieldError errors={[fieldErrors.email]} />
      </Field>
      <Field>
        <FieldLabel htmlFor="contact-phone">Phone (optional)</FieldLabel>
        <Input
          id="contact-phone"
          type="tel"
          autoComplete="tel"
          aria-invalid={Boolean(fieldErrors.phone)}
          {...form.register("phone")}
        />
        <FieldError errors={[fieldErrors.phone]} />
      </Field>
      <Field>
        <FieldLabel htmlFor="contact-subject">Subject (optional)</FieldLabel>
        <Input
          id="contact-subject"
          aria-invalid={Boolean(fieldErrors.subject)}
          {...form.register("subject")}
        />
        <FieldError errors={[fieldErrors.subject]} />
      </Field>
      <Field>
        <FieldLabel htmlFor="contact-message">Message</FieldLabel>
        <Textarea
          id="contact-message"
          aria-invalid={Boolean(fieldErrors.message)}
          {...form.register("message")}
        />
        <FieldError errors={[fieldErrors.message]} />
      </Field>
      {formError ? <p role="alert">{formError}</p> : null}
      {result?.ok ? (
        <p role="status">Thanks, your inquiry has been received.</p>
      ) : null}
      <Button type="submit" disabled={isPending} aria-live="polite">
        {isPending ? "Sending..." : result?.ok ? "Sent" : "Send message"}
      </Button>
    </form>
  );
}
