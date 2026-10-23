"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { submitInquirySchema } from "@/modules/contact/schemas/inquiry";
import { submitInquiry } from "@/modules/contact/server/actions";

type Values = z.input<typeof submitInquirySchema>;
type ValidatedValues = z.output<typeof submitInquirySchema>;
type SubmissionResult = Awaited<ReturnType<typeof submitInquiry>>;

export function useContactForm({ formToken }: { formToken: string }) {
  const pathname = usePathname();
  const [result, setResult] = useState<SubmissionResult | null>(null);
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
    setResult(null);
    const submission = await submitInquiry({ ...values, source: pathname });
    setResult(submission);
    if (!submission.ok) {
      for (const key of [
        "name",
        "email",
        "phone",
        "subject",
        "message",
      ] as const) {
        const message = submission.fieldErrors?.[key]?.[0];
        if (message) form.setError(key, { message });
      }
      return;
    }
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
  });

  return {
    form,
    onSubmit,
    isPending: form.formState.isSubmitting,
    fieldErrors: form.formState.errors,
    result,
    formError: result && !result.ok ? result.error : null,
  };
}
