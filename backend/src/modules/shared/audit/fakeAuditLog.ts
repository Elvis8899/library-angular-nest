import { Injectable } from "@nestjs/common";
import { AuditEntry, NewAuditEntry } from "@shared/audit/auditEntry";
import { AuditFilter, AuditLog } from "@shared/audit/auditLog";
import { TE } from "@shared/utils/application/monads";
import { Paginated } from "@shared/utils/database/repository.port";
import { PageWindow } from "@shared/utils/domain/query.base";
import { randomUUID } from "node:crypto";

const matches =
  ({ userId, useCase, recordId, from, before }: AuditFilter) =>
  (entry: AuditEntry): boolean =>
    (!userId || entry.userId === userId) &&
    (!useCase || entry.useCase.toLowerCase().includes(useCase.toLowerCase())) &&
    (!recordId || entry.recordId === recordId) &&
    (!from || entry.recordedAt >= from) &&
    (!before || entry.recordedAt < before);

/** The audit kept in memory, for the unit specs. */
@Injectable()
export class FakeAuditLog implements AuditLog {
  /** What was recorded, oldest first; specs inspect or add to it. */
  readonly entries: AuditEntry[] = [];
  /** The time the next entries get; specs set it. */
  now = new Date("2026-10-21T12:00:00Z");

  record = (entry: NewAuditEntry): TE.TaskEither<Error, void> => {
    this.entries.push({ ...entry, id: randomUUID(), recordedAt: this.now });
    return TE.of(undefined);
  };

  findPage = (
    filter: AuditFilter,
    { page, limit, offset }: PageWindow,
  ): TE.TaskEither<Error, Paginated<AuditEntry>> => {
    const found = this.entries.filter(matches(filter)).reverse();
    return TE.of({
      count: found.length,
      page,
      limit,
      data: found.slice(offset, offset + limit),
    });
  };
}
