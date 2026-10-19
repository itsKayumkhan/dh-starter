import { z } from "zod";
import { ROLES } from "@/lib/auth/permissions";

export const userIdSchema = z.object({ id: z.string().min(1).max(128) });
export const changeRoleSchema = userIdSchema.extend({ role: z.enum(ROLES) });
export const banUserSchema = userIdSchema.extend({
  reason: z.string().trim().min(3).max(500),
  expiresAt: z.iso.datetime({ offset: true }).optional(),
});
export const inviteUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254).transform((value) => value.toLowerCase()),
  role: z.enum(ROLES),
});
export const auditDateSchema = z.iso.date();

export function banDurationSeconds(expiresAt: string | undefined, now: Date): number | undefined {
  if (!expiresAt) return undefined;
  const seconds = Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / 1000);
  return Number.isSafeInteger(seconds) && seconds > 0 ? seconds : undefined;
}

export function mayChangeRole(actorId: string, targetId: string, currentRole: string, nextRole: string, adminCount: number): boolean {
  return actorId !== targetId && !(currentRole === "admin" && nextRole !== "admin" && adminCount <= 1);
}
