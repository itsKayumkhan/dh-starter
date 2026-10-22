import { send as resend } from "@/lib/email/providers/resend";
import { send as smtp } from "@/lib/email/providers/smtp";
import { send as consoleSend } from "@/lib/email/providers/console";

export type { ProviderInput } from "@/lib/email/providers/types";
export const providers = { resend, smtp, console: consoleSend };
