import { PinoLogger } from "nestjs-pino";
import { IQuery, IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Paginated } from "@shared/ddd";
import {
  PaginatedQueryPagination,
  PaginatedQueryValidator,
} from "@shared/ddd/query.base";
import { executeTask } from "@shared/utils/executeTask";
import { performRTE } from "@shared/utils/perform";
import { FPF, RTE } from "@shared/functional/monads";
import { fromInputRE } from "@src/shared/utils/fromInput";
import { User } from "../../domain/user.entity";
import { UserRepository } from "../../database/user.repository.port";

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
