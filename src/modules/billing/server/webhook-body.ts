export const MAX_WEBHOOK_BODY_BYTES = 1024 * 1024;

export class WebhookBodyTooLargeError extends Error {}

export async function readWebhookBody(request: Request): Promise<Buffer> {
  const length = request.headers.get("content-length");
  if (length !== null && Number(length) > MAX_WEBHOOK_BODY_BYTES)
    throw new WebhookBodyTooLargeError();
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_WEBHOOK_BODY_BYTES) throw new WebhookBodyTooLargeError();
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  return Buffer.concat(chunks, total);
}
