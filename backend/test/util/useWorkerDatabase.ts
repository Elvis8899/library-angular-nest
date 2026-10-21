import { workerDatabaseUrl } from "@test/util/workerDatabase";
import { get } from "env-var";

// Jest setupFiles: runs in each worker before a suite loads, so every
// PrismaService the suite creates connects to the worker's own database
process.env.DATABASE_URL = workerDatabaseUrl(
  get("DATABASE_URL").required().asString(),
  get("JEST_WORKER_ID").required().asString(),
);
