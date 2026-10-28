import { z } from "zod";

export const inquiryStatusSchema = z.enum(["new", "in_progress", "closed"]);
export const inquiryIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);

export const submitInquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(100),
  email: z.email("Enter a valid email address.").max(254),
  phone: z.string().trim().max(40).optional(),
  subject: z.string().trim().max(160).optional(),
  message: z.string().trim().min(10, "Enter at least 10 characters.").max(5000),
  source: z
    .string()
    .startsWith("/")
    .max(256)
    .refine((value) => !value.startsWith("//")),
  website: z.string().max(200).default(""),
  formToken: z.string().min(1),
});

export type SubmitInquiryInput = z.input<typeof submitInquirySchema>;
export type InquiryStatus = z.infer<typeof inquiryStatusSchema>;
