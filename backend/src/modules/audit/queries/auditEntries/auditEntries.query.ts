import { PageQuery, QueryString } from "@library/contracts";
import { AuditQueryInput } from "@modules/audit/domain/auditQuery";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { userNamesRTE } from "@modules/user/database/userNames";
import { IQuery, IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { AuditEntry } from "@shared/audit/auditEntry";
import { AuditLog } from "@shared/audit/auditLog";
import { inputsRTE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { performRTE } from "@shared/utils/application/perform";
import { UseCase } from "@shared/utils/application/useCase";
import { Paginated } from "@shared/utils/database/repository.port";
import {
  PageRequest,
  PageRequestSchema,
} from "@shared/utils/domain/query.base";

export class AuditEntriesQuery implements IQuery {
  constructor(
    // The query string's, or numbers from a caller in the code
    public readonly page: PageRequest | QueryString<typeof PageQuery>,
    // The query string's, parsed by the handler
    public readonly filters: Record<string, unknown>,
  ) {}
}

export type AuditPage = {
  page: Paginated<AuditEntry>;
  /** The names of the users the page shows. */
  names: ReadonlyMap<string, string>;
};

@QueryHandler(AuditEntriesQuery)
export class AuditEntriesQueryHandler implements IQueryHandler<
  AuditEntriesQuery,
  AuditPage
> {
  constructor(
    private readonly useCase: UseCase,
    private readonly auditLog: AuditLog,
    private readonly userRepository: UserRepository,
  ) {}

  execute(query: AuditEntriesQuery): Promise<AuditPage> {
    return this.useCase.run(
      "AuditEntries",
      query,
      FPF.pipe(
        inputsRTE({
          window: [PageRequestSchema, "page", query.page],
          filters: [AuditQueryInput, "AuditQuery", query.filters],
        }),
        RTE.chain(({ window, filters }) =>
          performRTE(
            () => this.auditLog.findPage(filters, window),
            "get audit entries",
          )(undefined),
        ),
        RTE.bindTo("page"),
        RTE.bind("names", ({ page }) =>
          userNamesRTE(this.userRepository)(
            page.data.map(({ userId }) => userId),
          ),
        ),
      ),
    );
  }
}
