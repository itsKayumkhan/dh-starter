import { z } from "zod";
import { passwordSchema } from "@/components/auth/schemas";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters").max(80),
  imageUrl: z
    .string()
    .trim()
    .max(2048)
    .refine(
      (value) =>
        value === "" ||
        (z.url().safeParse(value).success &&
          new URL(value).protocol === "https:"),
      "Use a secure HTTPS image URL",
    ),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
    revokeOtherSessions: z.boolean(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password"),
});
export const revokeSessionSchema = z.object({ id: z.string().min(1).max(128) });
export const emptySchema = z.object({});
