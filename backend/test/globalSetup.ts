// Jest's globalSetup runs outside the test runtime, where the path aliases
// aren't mapped
/* eslint-disable no-restricted-imports -- jest */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client";
import { workerDatabaseUrl } from "./util/workerDatabase";
/* eslint-enable no-restricted-imports -- the aliases again */

const quote = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`;

const databaseName = (url: string) =>
  decodeURIComponent(new URL(url).pathname.slice(1));

/**
 * Copies the migrated test database (DATABASE_URL, migrated by
 * `yarn test:migrate`) to one database per Jest worker, so the suites can
 * run in parallel. A fresh copy each run keeps them on the latest migration.
 */
export default async function globalSetup(
  // Jest's GlobalConfig: --maxWorkers, or the default from the CPUs
  globalConfig: { maxWorkers: number },
): Promise<void> {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) throw new Error("DATABASE_URL is not set (.env.test)");

  // CREATE DATABASE can't run while anyone, this script included, is
  // connected to the template, so this connects to the server's postgres
  // database instead
  const maintenanceUrl = new URL(baseUrl);
  maintenanceUrl.pathname = "/postgres";
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: maintenanceUrl.toString() }),
  });
  const template = quote(databaseName(baseUrl));
  try {
    for (let worker = 1; worker <= globalConfig.maxWorkers; worker++) {
      const database = quote(databaseName(workerDatabaseUrl(baseUrl, worker)));
      await prisma.$executeRawUnsafe(
        `DROP DATABASE IF EXISTS ${database} WITH (FORCE)`,
      );
      await prisma.$executeRawUnsafe(
        `CREATE DATABASE ${database} TEMPLATE ${template}`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}
