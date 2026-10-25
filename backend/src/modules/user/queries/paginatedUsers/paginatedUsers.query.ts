import { PageQuery, QueryString } from "@library/contracts";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { User } from "@modules/user/domain/user.entity";
import { IQuery, IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { performRTE } from "@shared/utils/application/perform";
import { UseCase } from "@shared/utils/application/useCase";
import { Paginated } from "@shared/utils/database/repository.port";
import {
  PageRequest,
  PageRequestSchema,
} from "@shared/utils/domain/query.base";

export class PaginatedUsersQuery implements IQuery {
  constructor(
    // The query string's, or numbers from a caller in the code
    public readonly params: PageRequest | QueryString<typeof PageQuery>,
  ) {}
}

@QueryHandler(PaginatedUsersQuery)
export class PaginatedUsersQueryHandler implements IQueryHandler<
  PaginatedUsersQuery,
  Paginated<User>
> {
  constructor(
    private readonly useCase: UseCase,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * In read model we don't need to execute
   * any business logic, so we can bypass
   * domain and repository layers completely
   * and execute query directly
   */
  execute(query: PaginatedUsersQuery): Promise<Paginated<User>> {
    return this.useCase.run(
      "PaginatedUsers",
      query,
      FPF.pipe(
        query.params,
        fromInputRE(PageRequestSchema, "PaginatedUsersQuery"),
        RTE.fromReaderEither,
        RTE.chain(
          performRTE(
            this.userRepository.findAllPaginated,
            "get user list in storage system.",
          ),
        ),
      ),
    );
  }
}
