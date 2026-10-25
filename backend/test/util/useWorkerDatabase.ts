import { workerDatabaseUrl } from "@test/util/workerDatabase";
import { workerBucket } from "@test/util/workerStorage";
import { get } from "env-var";
import { inject } from "vitest";

// Vitest setupFiles: runs in each worker before a suite loads, so every
// PrismaService the suite creates connects to the worker's own database,
// and the file storage uses the worker's own bucket, both of this run. The
// worker runs it again before each file (the suites aren't isolated), so the
// names start from the template's, kept the first time
const templateUrl = (process.env.TEST_TEMPLATE_DATABASE_URL ??= get(
  "DATABASE_URL",
)
  .required()
  .asString());
const templateBucket = (process.env.TEST_TEMPLATE_S3_BUCKET ??= get("S3_BUCKET")
  .required()
  .asString());

process.env.DATABASE_URL = workerDatabaseUrl(
  templateUrl,
  inject("testRun"),
  get("VITEST_POOL_ID").required().asString(),
);
process.env.S3_BUCKET = workerBucket(
  templateBucket,
  inject("testRun"),
  get("VITEST_POOL_ID").required().asString(),
);
