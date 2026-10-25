import { randomBytes } from "node:crypto";

/**
 * The id of one Vitest run, in the names of its databases and buckets
 * (library-test-<run>-<worker>), so runs at the same time never touch
 * each other's. It starts with the run's start time, so a later run can tell
 * what a killed one left behind. test/globalSetup.ts provides it to the
 * workers as `testRun`.
 */
export const newTestRun = (now = Date.now()): string =>
  `t${now.toString(36)}${randomBytes(2).toString("hex")}`;

/** When the run that named `name` (a database or bucket under `base`) began. */
export const testRunStart = (
  base: string,
  name: string,
): number | undefined => {
  if (!name.startsWith(`${base}-`)) return undefined;
  const start = /^t([0-9a-z]{8})[0-9a-f]{4}-/.exec(
    name.slice(base.length + 1),
  )?.[1];
  return start === undefined ? undefined : parseInt(start, 36);
};

declare module "vitest" {
  export interface ProvidedContext {
    testRun: string;
  }
}
