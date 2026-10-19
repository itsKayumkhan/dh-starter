import { z } from "zod";

export const notificationsEnvSchema = z.object({});
export function getNotificationsEnv() {
  return notificationsEnvSchema.parse({});
}

const e2ePrerequisitesSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  BETTER_AUTH_URL: z.url().optional(),
});

export function getNotificationsE2ePrerequisites() {
  return e2ePrerequisitesSchema.parse(process.env);
}
