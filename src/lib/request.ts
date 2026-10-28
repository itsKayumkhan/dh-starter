import { headers } from "next/headers";
import { z } from "zod";
import { getServerEnv } from "@/lib/env/server";

const ipSchema = z.union([z.ipv4(), z.ipv6()]);

export function resolveClientIp(
  forwardedFor: string | null,
  trustedProxyHops: number,
): string {
  if (trustedProxyHops < 1 || !Number.isInteger(trustedProxyHops))
    return "unknown";
  const chain = forwardedFor?.split(",").map((value) => value.trim()) ?? [];
  const candidate = chain[chain.length - trustedProxyHops];
  return ipSchema.safeParse(candidate).data ?? "unknown";
}

export async function getClientIp(): Promise<string> {
  const header = await headers();
  return resolveClientIp(
    header.get("x-forwarded-for"),
    getServerEnv().TRUSTED_PROXY_HOPS,
  );
}
