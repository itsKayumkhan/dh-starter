// @vitest-environment node
import { afterEach, expect, test, vi } from "vitest";
import { withContentBlockSnapshot } from "./cms-snapshot";

afterEach(() => vi.unstubAllEnvs());

function localEnv() {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  vi.stubEnv(
    "DATABASE_URL",
    "postgres://postgres:postgres@localhost:5433/dh_starter_e2e?sslmode=disable",
  );
}

test("CMS snapshot refuses remote databases before connecting", async () => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  const connect = vi.fn();
  for (const url of [
    "postgres://user:pass@staging.example.com:5432/dh_starter_e2e",
    "postgres://user:pass@localhost:5432/dh_starter_e2e?host=staging.example.com",
  ]) {
    vi.stubEnv("DATABASE_URL", url);
    await expect(
      withContentBlockSnapshot("home.hero", async () => undefined, connect),
    ).rejects.toThrow("E2E requires");
  }
  expect(connect).not.toHaveBeenCalled();
});

test("CMS snapshot restores the exact existing row when the test fails", async () => {
  localEnv();
  const updatedAt = new Date("2025-01-02T03:04:05.000Z");
  const original = {
    value: { title: "Existing title", nested: { href: "/old" } },
    updatedAt,
    updatedBy: "editor-id",
  };
  const query = vi
    .fn()
    .mockResolvedValueOnce({ rows: [original] })
    .mockResolvedValue({ rows: [] });
  const client = {
    connect: vi.fn().mockResolvedValue(undefined),
    query,
    end: vi.fn().mockResolvedValue(undefined),
  };
  await expect(
    withContentBlockSnapshot(
      "home.hero",
      async () => {
        throw new Error("browser failed");
      },
      () => client,
    ),
  ).rejects.toThrow("browser failed");
  expect(query).toHaveBeenCalledTimes(2);
  expect(query.mock.calls[1][1]).toEqual([
    "home.hero",
    JSON.stringify(original.value),
    updatedAt,
    "editor-id",
  ]);
  expect(client.end).toHaveBeenCalledOnce();
});

test("CMS snapshot removes a block that did not exist before the test", async () => {
  localEnv();
  const query = vi
    .fn()
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValue({ rows: [] });
  const client = {
    connect: vi.fn().mockResolvedValue(undefined),
    query,
    end: vi.fn().mockResolvedValue(undefined),
  };
  await withContentBlockSnapshot(
    "home.hero",
    async () => undefined,
    () => client,
  );
  expect(query.mock.calls[1][0]).toContain('delete from "ContentBlock"');
  expect(query.mock.calls[1][1]).toEqual(["home.hero"]);
});
