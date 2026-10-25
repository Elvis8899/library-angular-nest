import type { AuditEntry } from "@library/contracts";

/** Who changed what: one per write that succeeded. */
export type AuditEntryEntity = AuditEntry;

/** The screen's filters; a blank one is none. */
export interface AuditQuery {
  userId: string;
  useCase: string;
  recordId: string;
  // yyyy-MM-dd, both days included
  from: string;
  to: string;
}

export const noAuditFilters: AuditQuery = {
  userId: "",
  useCase: "",
  recordId: "",
  from: "",
  to: "",
};

// The instant a yyyy-MM-dd day starts here, the given number of days later
const dayStart = (day: string, later = 0): string => {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date + later).toISOString();
};

/** The filters the API reads: the filled ones, the days as the instants
 * they cover in the browser's time zone (`from`, and `before` the day after
 * `to`). */
export const auditParams = ({
  from,
  to,
  ...texts
}: AuditQuery): Record<string, string> => ({
  ...Object.fromEntries(Object.entries(texts).filter(([, value]) => value)),
  ...(from && { from: dayStart(from) }),
  ...(to && { before: dayStart(to, 1) }),
});

/** The input as indented JSON, for the entry's details. */
export const inputText = (input: unknown): string =>
  input === null || input === undefined ? "" : JSON.stringify(input, null, 2);
