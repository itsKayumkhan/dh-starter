import { describe, expect, it, vi } from "vitest";

const { logInfo } = vi.hoisted(() => ({ logInfo: vi.fn() }));
vi.mock("@/lib/env/server", () => ({
  getServerEnv: () => ({ NODE_ENV: "development" }),
}));
vi.mock("@/lib/logger", () => ({ logger: { info: logInfo } }));

import { send } from "./console";

describe("development email logging", () => {
  it("does not record recipient or subject", async () => {
    await send({
      to: "private@example.test",
      from: "sender@example.test",
      subject: "Sensitive account details",
      html: "<p>Body</p>",
      text: "Body",
    });
    expect(JSON.stringify(logInfo.mock.calls)).not.toContain(
      "private@example.test",
    );
    expect(JSON.stringify(logInfo.mock.calls)).not.toContain(
      "Sensitive account details",
    );
  });
});
