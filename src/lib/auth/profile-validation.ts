import { APIError } from "better-auth/api";
import {
  profileNameSchema,
  profileImageSchema,
} from "@/lib/auth/profile-rules";

export function validateProfileUpdate(data: Record<string, unknown>): {
  data: Record<string, unknown>;
} {
  const normalized: Record<string, unknown> = {};
  if (data.name !== undefined) {
    const parsed = profileNameSchema.safeParse(data.name);
    if (!parsed.success)
      throw new APIError("BAD_REQUEST", { message: "Invalid profile name." });
    normalized.name = parsed.data;
  }
  if (data.image !== undefined && data.image !== null) {
    const parsed = profileImageSchema.safeParse(data.image);
    if (!parsed.success)
      throw new APIError("BAD_REQUEST", {
        message: "Invalid profile image URL.",
      });
    normalized.image = parsed.data;
  }
  return { data: normalized };
}
