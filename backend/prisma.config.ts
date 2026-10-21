import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer loads .env by itself. Variables that are already set
// (env-cmd in the test scripts, env_file in Docker Compose) take precedence
config({ quiet: true });

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node -r tsconfig-paths/register --transpile-only prisma/seed.ts",
  },
  datasource: {
    // Not env("DATABASE_URL"), which throws when it's unset: prisma generate
    // runs without a database, as in the Docker image builds
    url: process.env.DATABASE_URL,
  },
});
