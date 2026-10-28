import { z } from "zod";
import { passwordSchema } from "@/components/auth/schemas";
import {
  profileNameSchema,
  profileImageSchema,
} from "@/lib/auth/profile-rules";

export const profileSchema = z.object({
  name: profileNameSchema,
  imageUrl: profileImageSchema,
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
  password: z.string(),
});
export const revokeSessionSchema = z.object({ id: z.string().min(1).max(128) });
export const emptySchema = z.object({});
