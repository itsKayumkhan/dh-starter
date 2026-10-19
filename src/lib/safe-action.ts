import "server-only";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { type ActionResult, fail, fromZodError, ok } from "@/lib/action-result";
import { assertPermission, assertUser } from "@/lib/auth/session";
import type { Permission } from "@/lib/auth/permissions";
import { MESSAGES } from "@/lib/constants/messages";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { assertRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

type Options<S extends z.ZodType> = {
  schema: S;
  auth?: "user" | "public";
  permission?: Permission;
  rateLimit?: { key: string; limit: number; windowSec: number };
};
export function safeAction<S extends z.ZodType, T>(
  options: Options<S>,
  handler: (
    input: z.output<S>,
    ctx: { user: Awaited<ReturnType<typeof assertUser>> | null; ip: string },
  ) => Promise<T>,
) {
  return async (input: unknown): Promise<ActionResult<T>> => {
    const parsed = options.schema.safeParse(input);
    if (!parsed.success)
      return fail(MESSAGES.validation, fromZodError(parsed.error));
    try {
      const user = options.permission
        ? await assertPermission(options.permission)
        : options.auth === "public"
          ? null
          : await assertUser();
      const ip = await getClientIp();
      if (options.rateLimit)
        await assertRateLimit(
          `${options.rateLimit.key}:${user?.id ?? ip}`,
          options.rateLimit.limit,
          options.rateLimit.windowSec,
        );
      return ok(await handler(parsed.data, { user, ip }));
    } catch (error) {
      unstable_rethrow(error);
      if (error instanceof AppError) return fail(error.message);
      logger.error("Action failed", { error });
      return fail(MESSAGES.internal);
    }
  };
}
