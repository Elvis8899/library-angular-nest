import { PageQuery, QueryString } from "@library/contracts";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { User } from "@modules/user/domain/user.entity";
import { Query, QueryHandler } from "@shared/utils/application/cqrs";
import { inputRTE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { perform } from "@shared/utils/application/perform";
import { UseCaseHandler } from "@shared/utils/application/useCase";
import { Paginated } from "@shared/utils/database/repository.port";
import {
  PageRequest,
  PageRequestSchema,
} from "@shared/utils/domain/query.base";

export class PaginatedUsersQuery extends Query<Paginated<User>> {
  constructor(
    // The query string's, or numbers from a caller in the code
    public readonly params: PageRequest | QueryString<typeof PageQuery>,
  ) {
    super();
  }
}

@QueryHandler(PaginatedUsersQuery)
export class PaginatedUsersQueryHandler extends UseCaseHandler<PaginatedUsersQuery> {
  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  /**
   * In read model we don't need to execute
   * any business logic, so we can bypass
   * domain and repository layers completely
   * and execute query directly
   */
  protected pipeline(query: PaginatedUsersQuery) {
    return FPF.pipe(
      inputRTE(PageRequestSchema, "PaginatedUsersQuery", query.params),
      RTE.chain(perform(this.userRepository).findAllPaginated),
    );
  }
}
