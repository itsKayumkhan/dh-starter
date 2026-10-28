import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const MIN_FILL_MS = 3000;
export const MAX_AGE_MS = 15 * 60 * 1000;

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createFormToken(secret: string, now = Date.now()) {
  const payload = `${now}.${randomBytes(16).toString("hex")}`;
  return `${payload}.${signature(payload, secret)}`;
}

export function isFormTokenReady(
  token: string,
  secret: string,
  now = Date.now(),
) {
  const match = /^(\d{13})\.([a-f0-9]{32})\.([a-f0-9]{64})$/.exec(token);
  if (!match) return false;
  const timestamp = Number(match[1]);
  const age = now - timestamp;
  if (!Number.isSafeInteger(timestamp) || age < MIN_FILL_MS || age > MAX_AGE_MS)
    return false;
  const payload = `${match[1]}.${match[2]}`;
  const expected = Buffer.from(signature(payload, secret), "hex");
  const received = Buffer.from(match[3], "hex");
  return timingSafeEqual(expected, received);
}
