import { PrismaClient } from "@db/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { newTestRun, testRunStart } from "@test/util/testRun";
import { workerDatabaseUrl } from "@test/util/workerDatabase";
import type { TestProject } from "vitest/node";

const quote = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`;

const databaseName = (url: string) =>
  decodeURIComponent(new URL(url).pathname.slice(1));

// Longer than any run, watch mode included
const staleAfterMs = 24 * 60 * 60 * 1000;

// CREATE DATABASE can't run while anyone, this script included, is connected
// to the template, so this connects to the server's postgres database instead
const maintenanceClient = (baseUrl: string) => {
  const url = new URL(baseUrl);
  url.pathname = "/postgres";
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: url.toString() }),
  });
};

/** Drops the databases named `<template>-…` that `isGone` picks. */
const dropDatabases = async (
  prisma: PrismaClient,
  template: string,
  isGone: (name: string) => boolean,
): Promise<void> => {
  const databases = await prisma.$queryRawUnsafe<{ datname: string }[]>(
    "SELECT datname FROM pg_database WHERE starts_with(datname, $1)",
    `${template}-`,
  );
  for (const { datname } of databases)
    if (isGone(datname))
      await prisma.$executeRawUnsafe(
        `DROP DATABASE IF EXISTS ${quote(datname)} WITH (FORCE)`,
      );
};

/**
 * Copies the migrated test database (DATABASE_URL, migrated by
 * `yarn test:migrate`) to one database per Vitest worker, so the suites can
 * run in parallel. The copies carry this run's id, so runs at the same time
 * don't meet, and are dropped when the run ends; a run also drops what a
 * killed one left a day ago or more. A fresh copy each run keeps them on the
 * latest migration. Refuses a database whose name doesn't say "test".
 */
export default async function globalSetup(
  project: TestProject,
): Promise<() => Promise<void>> {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) throw new Error("DATABASE_URL is not set (.env.test)");
  // A DATABASE_URL already set wins over .env.test (env-cmd --no-override),
  // so each worktree can test on its own database; the suites empty theirs,
  // so never one that isn't a test database
  const template = databaseName(baseUrl);
  if (!template.includes("test"))
    throw new Error(
      `DATABASE_URL names ${template}, which isn't a test database`,
    );

  const run = newTestRun();
  project.provide("testRun", run);
  const startedBefore = (base: string) => (name: string) =>
    (testRunStart(base, name) ?? Infinity) < Date.now() - staleAfterMs;
  const ofThisRun = (base: string) => (name: string) =>
    name.startsWith(`${base}-${run}-`);

  const prisma = maintenanceClient(baseUrl);
  try {
    await dropDatabases(prisma, template, startedBefore(template));
    // --maxWorkers, or the config's share of the CPUs
    for (let worker = 1; worker <= project.globalConfig.maxWorkers; worker++)
      await prisma.$executeRawUnsafe(
        `CREATE DATABASE ${quote(databaseName(workerDatabaseUrl(baseUrl, run, worker)))} TEMPLATE ${quote(template)}`,
      );
  } finally {
    await prisma.$disconnect();
  }

  return async () => {
    const teardown = maintenanceClient(baseUrl);
    try {
      await dropDatabases(teardown, template, ofThisRun(template));
    } finally {
      await teardown.$disconnect();
    }
  };
}
