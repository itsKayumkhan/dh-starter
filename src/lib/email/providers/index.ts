import { send as resend } from "@/lib/email/providers/resend";
import { send as smtp } from "@/lib/email/providers/smtp";
import { send as consoleSend } from "@/lib/email/providers/console";

export type ProviderInput = {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};
export const providers = { resend, smtp, console: consoleSend };
