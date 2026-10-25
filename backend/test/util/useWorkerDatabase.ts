import { workerDatabaseUrl } from "@test/util/workerDatabase";
import { get } from "env-var";
import { inject } from "vitest";

// Vitest setupFiles: runs in each worker before a suite loads, so every
// PrismaService the suite creates connects to the worker's own database of
// this run. The worker runs it again before each file (the suites aren't
// isolated), so the name starts from the template's, kept the first time
const templateUrl = (process.env.TEST_TEMPLATE_DATABASE_URL ??= get(
  "DATABASE_URL",
)
  .required()
  .asString());

process.env.DATABASE_URL = workerDatabaseUrl(
  templateUrl,
  inject("testRun"),
  get("VITEST_POOL_ID").required().asString(),
);
