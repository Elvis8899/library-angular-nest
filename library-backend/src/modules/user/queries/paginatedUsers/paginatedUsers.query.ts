import { IQuery, IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Paginated } from "@shared/ddd";
import {
  PaginatedQueryPagination,
  PaginatedQueryValidator,
} from "@shared/ddd/query.base";
import { FPF, RTE } from "@shared/functional/monads";
import { executeTask } from "@shared/utils/executeTask";
import { fromInputRE } from "@shared/utils/fromInput";
import { performRTE } from "@shared/utils/perform";
import { UserRepository } from "@user/database/user.repository.port";
import { User } from "@user/domain/user.entity";
import { PinoLogger } from "nestjs-pino";

export class PaginatedUsersQuery implements IQuery {
  constructor(public readonly params: PaginatedQueryPagination) {}
}

@QueryHandler(PaginatedUsersQuery)
export class PaginatedUsersQueryHandler implements IQueryHandler<
  PaginatedUsersQuery,
  Paginated<User>
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("PaginatedUsers");
  }

  /**
   * In read model we don't need to execute
   * any business logic, so we can bypass
   * domain and repository layers completely
   * and execute query directly
   */
  async execute(query: PaginatedUsersQuery): Promise<Paginated<User>> {
    const task = FPF.pipe(
      query.params,
      fromInputRE(PaginatedQueryValidator, "PaginatedUsersQuery"),
      RTE.fromReaderEither,
      RTE.chain(
        performRTE(
          this.userRepository.findAllPaginated,
          "get user list in storage system.",
        ),
      ),
    )({ logger: this.logger });
    return executeTask(task);
  }
}
