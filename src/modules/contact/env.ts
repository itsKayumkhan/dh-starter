import { z } from "zod";

const schema = z.object({
  CONTACT_NOTIFY_EMAIL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.email().optional(),
  ),
});

export function getContactEnv() {
  const env = schema.parse(process.env);
  return { notifyEmail: env.CONTACT_NOTIFY_EMAIL };
}

export function hasContactE2EEnv() {
  return z
    .object({
      DATABASE_URL: z.url(),
      BETTER_AUTH_SECRET: z.string().min(32),
      BETTER_AUTH_URL: z.url(),
      EMAIL_FROM: z.string().min(3),
    })
    .safeParse(process.env).success;
}
