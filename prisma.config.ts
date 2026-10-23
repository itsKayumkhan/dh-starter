import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.mts" },
  // Generation can run before .env exists. Migration still requires a real URL.
  datasource: {
    url: (() => {
      try {
        return env("DATABASE_URL");
      } catch {
        return "postgresql://invalid:invalid@localhost:1/invalid";
      }
    })(),
  },
});
