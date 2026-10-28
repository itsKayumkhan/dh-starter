import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { getSeedEnv } from "../src/lib/env/seed";

const env = getSeedEnv();
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
});
const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: { enabled: true },
});

const users = [
  {
    email: "admin@dhstarter.test",
    password: "DhStarter@Admin2026",
    name: "Admin",
    role: "admin",
  },
  {
    email: "staff@dhstarter.test",
    password: "DhStarter@Staff2026",
    name: "Staff",
    role: "staff",
  },
  {
    email: "user@dhstarter.test",
    password: "DhStarter@User2026",
    name: "User",
    role: "user",
  },
] as const;

for (const seed of users) {
  const existing = await db.user.findUnique({ where: { email: seed.email } });
  if (existing) continue;
  const created = await auth.api.signUpEmail({
    body: { email: seed.email, password: seed.password, name: seed.name },
  });
  await db.user.update({
    where: { id: created.user.id },
    data: { role: seed.role, emailVerified: true },
  });
}
await db.$disconnect();
