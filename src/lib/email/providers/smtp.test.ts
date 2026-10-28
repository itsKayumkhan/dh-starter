import { beforeEach, describe, expect, it, vi } from "vitest";

const { createTransport, sendMail } = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
}));
vi.mock("nodemailer", () => ({ default: { createTransport } }));
vi.mock("@/lib/env/server", () => ({ getServerEnv: vi.fn() }));

import { getServerEnv } from "@/lib/env/server";
import { send } from "./smtp";

const input = {
  to: "recipient@example.test",
  from: "sender@example.test",
  subject: "Subject",
  html: "<p>Body</p>",
  text: "Body",
};

describe("SMTP transport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createTransport.mockReturnValue({ sendMail });
    sendMail.mockResolvedValue({ messageId: "message-1" });
  });

  it("requires STARTTLS and bounds waits on a submission connection", async () => {
    vi.mocked(getServerEnv).mockReturnValue({
      SMTP_HOST: "smtp.example.test",
      SMTP_PORT: 587,
      SMTP_SECURE: false,
      SMTP_USER: "user",
      SMTP_PASS: "pass",
    } as ReturnType<typeof getServerEnv>);
    await send(input);
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        secure: false,
        requireTLS: true,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
      }),
    );
  });

  it("uses implicit TLS without STARTTLS on a secure connection", async () => {
    vi.mocked(getServerEnv).mockReturnValue({
      SMTP_HOST: "smtp.example.test",
      SMTP_PORT: 465,
      SMTP_SECURE: true,
    } as ReturnType<typeof getServerEnv>);
    await send(input);
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ secure: true, requireTLS: false }),
    );
  });
});
