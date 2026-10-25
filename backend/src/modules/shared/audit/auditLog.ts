import { AuditEntry, NewAuditEntry } from "@shared/audit/auditEntry";
import { TE } from "@shared/utils/application/monads";
import { Paginated } from "@shared/utils/database/repository.port";
import { PageWindow } from "@shared/utils/domain/query.base";

/** What the audit screen filters by; every field optional. */
export type AuditFilter = {
  userId?: string;
  // Part of the handler's name, any case ("worker" finds UpdateWorker)
  useCase?: string;
  recordId?: string;
  // The instants the period covers, from included to before excluded
  from?: Date;
  before?: Date;
};

/** Where the audit entries are kept: written once, never changed. */
export abstract class AuditLog {
  record!: (entry: NewAuditEntry) => TE.TaskEither<Error, void>;
  /** The entries matching the filter, newest first. */
  findPage!: (
    filter: AuditFilter,
    window: PageWindow,
  ) => TE.TaskEither<Error, Paginated<AuditEntry>>;
}
