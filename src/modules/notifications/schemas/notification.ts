import { z } from "zod";
import { ROLES } from "@/lib/auth/permissions";

const localHref = z
  .string()
  .max(2048)
  .refine(
    (value) =>
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !/[\\\r\n\0]/.test(value),
    "Enter a local path starting with /.",
  );

export const notificationInputSchema = z.object({
  type: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(2000),
  href: localHref.optional(),
});

export const adminSendSchema = z
  .object({
    target: z.enum(["user", "role", "all"]),
    userId: z.string().trim().optional(),
    role: z.enum(ROLES).optional(),
    title: notificationInputSchema.shape.title,
    body: notificationInputSchema.shape.body,
    href: z.union([localHref, z.literal("")]).optional(),
    email: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.target === "user" && !value.userId) {
      ctx.addIssue({
        code: "custom",
        path: ["userId"],
        message: "Enter a user ID.",
      });
    }
    if (value.target === "role" && !value.role) {
      ctx.addIssue({
        code: "custom",
        path: ["role"],
        message: "Choose a role.",
      });
    }
  });

export const notificationIdSchema = z.string().cuid();
export type AdminSendInput = z.input<typeof adminSendSchema>;
