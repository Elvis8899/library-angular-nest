import {
  AuditEntry as AuditEntryContract,
  AuditQuery,
  Sent,
} from "@library/contracts";
import { AuditEntry } from "@shared/audit/auditEntry";
import { z } from "zod";

/** The audit screen's filters, as the API's contract reads them (the same
 * fields the store's `AuditFilter` takes). */
export const AuditQueryInput = AuditQuery;
export type AuditQueryInput = z.output<typeof AuditQuery>;

/** An entry as the API sends it, with the name of who made it. */
export const auditEntryView =
  (names: ReadonlyMap<string, string>) =>
  (entry: AuditEntry): Sent<typeof AuditEntryContract> => ({
    ...entry,
    userName: entry.userId === null ? null : (names.get(entry.userId) ?? null),
  });
