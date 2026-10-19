import { headers } from "next/headers";
import { z } from "zod";

const ipSchema = z.union([z.ipv4(), z.ipv6()]);

export async function getClientIp(): Promise<string> {
  const header = await headers();
  const forwarded = header.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    ipSchema.safeParse(forwarded || header.get("x-real-ip")).data ?? "unknown"
  );
}
