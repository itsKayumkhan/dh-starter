import { connection } from "next/server";
import { getServerEnv } from "@/lib/env/server";
import { ContactForm } from "@/modules/contact/components/contact-form";
import { createFormToken } from "@/modules/contact/server/form-token";

export async function ContactFormWithToken() {
  await connection();
  const token = createFormToken(getServerEnv().BETTER_AUTH_SECRET);
  return <ContactForm formToken={token} />;
}
