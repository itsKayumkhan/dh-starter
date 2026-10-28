import { z } from "zod";

export const profileNameSchema = z
  .string()
  .trim()
  .min(2, "Enter at least 2 characters")
  .max(80);
export const profileImageSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) =>
      value === "" ||
      (z.url().safeParse(value).success &&
        new URL(value).protocol === "https:"),
    "Use a secure HTTPS image URL",
  );
