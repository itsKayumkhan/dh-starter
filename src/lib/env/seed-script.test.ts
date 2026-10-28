import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, update, signUpEmail, disconnect } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  signUpEmail: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock("dotenv/config", () => ({}));
vi.mock("./seed", () => ({
  getSeedEnv: () => ({
    DATABASE_URL: "postgres://postgres:pass@localhost:5432/starter",
    BETTER_AUTH_URL: "http://localhost:3000",
    BETTER_AUTH_SECRET: "a".repeat(32),
  }),
}));
vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: class {} }));
vi.mock("../../generated/prisma/client", () => ({
  PrismaClient: class {
    user = { findUnique, update };
    $disconnect = disconnect;
  },
}));
vi.mock("better-auth/adapters/prisma", () => ({ prismaAdapter: () => ({}) }));
vi.mock("better-auth", () => ({
  betterAuth: () => ({ api: { signUpEmail } }),
}));

describe("seed account handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("never changes any existing fixture account", async () => {
    findUnique.mockResolvedValue({ id: "existing-user" });
    const seedModule = "../../../prisma/seed.mts";
    await import(seedModule);
    expect(findUnique).toHaveBeenCalledTimes(3);
    expect(signUpEmail).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalled();
  });

  it("sets role only for the newly created account ID", async () => {
    findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: "existing-user" });
    signUpEmail.mockResolvedValue({ user: { id: "new-user" } });
    const seedModule = "../../../prisma/seed.mts";
    await import(seedModule);
    expect(signUpEmail).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({
      where: { id: "new-user" },
      data: { role: "admin", emailVerified: true },
    });
  });
});
