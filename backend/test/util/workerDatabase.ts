/**
 * The database of one Jest worker: library-test-1, library-test-2… for
 * library-test. test/globalSetup.ts copies the migrated test database to
 * each before the suites run, so workers never share tables.
 */
export const workerDatabaseUrl = (
  baseUrl: string,
  workerId: string | number,
): string => {
  const url = new URL(baseUrl);
  url.pathname = `${url.pathname}-${String(workerId)}`;
  return url.toString();
};
