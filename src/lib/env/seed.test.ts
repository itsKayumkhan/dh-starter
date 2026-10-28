import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getSeedEnv } from "./seed";

const originalEnv = { ...process.env };
const originalArgv = [...process.argv];

describe("seed environment guard", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: "postgres://postgres:pass@localhost:5432/starter",
      BETTER_AUTH_SECRET: "a".repeat(32),
      BETTER_AUTH_URL: "http://localhost:3000",
      NODE_ENV: "development",
    };
    process.argv = ["node", "prisma/seed.mts"];
  });
  afterEach(() => {
    process.env = { ...originalEnv };
    process.argv = [...originalArgv];
  });

  it("allows a local development database", () => {
    expect(getSeedEnv().DATABASE_URL).toContain("localhost");
  });

  it.each([
    ["production", "localhost"],
    ["development", "db.example.test"],
  ])(
    "blocks %s seeding at %s without both confirmations",
    (environment, host) => {
      process.env = {
        ...process.env,
        NODE_ENV: environment as "production" | "development",
        DATABASE_URL: `postgres://postgres:pass@${host}:5432/starter`,
      };
      expect(() => getSeedEnv()).toThrow("Seed blocked");
      process.argv.push("--allow-remote");
      expect(() => getSeedEnv()).toThrow("Seed blocked");
      process.env.SEED_CONFIRM_REMOTE = "CREATE_KNOWN_SEED_USERS";
      expect(() => getSeedEnv()).not.toThrow();
    },
  );
});
