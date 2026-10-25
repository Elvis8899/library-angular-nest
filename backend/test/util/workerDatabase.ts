/**
 * The database of one Vitest worker in one run: library-test-<run>-1,
 * library-test-<run>-2… for library-test. test/globalSetup.ts copies
 * the migrated test database to each before the suites run, so workers never
 * share tables, and drops them after.
 */
export const workerDatabaseUrl = (
  baseUrl: string,
  run: string,
  workerId: string | number,
): string => {
  const url = new URL(baseUrl);
  url.pathname = `${url.pathname}-${run}-${String(workerId)}`;
  return url.toString();
};
