import { PinoLogger } from "nestjs-pino";
import { IQuery, IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { executeTask } from "@shared/utils/executeTask";
import { performRTE } from "@shared/utils/perform";
import { FPF, RTE } from "@shared/functional/monads";
import { User } from "../../domain/user.entity";
import { UserRepository } from "../../database/user.repository.port";
import { fromInputRE } from "@src/shared/utils/fromInput";
import { UUID } from "@src/shared/uuid/entities/uuid";
import { userNotFoundException } from "../../domain/user.errors";

export class GetUserByIdQuery implements IQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdQueryHandler
  implements IQueryHandler<GetUserByIdQuery, User>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("GetUserById");
  }

  /**
   * In read model we don't need to execute
   * any business logic, so we can bypass
   * domain and repository layers completely
   * and execute query directly
   */
  async execute(query: GetUserByIdQuery): Promise<User> {
    const task = FPF.pipe(
      query.id,
      fromInputRE(UUID, "UUID"),
      RTE.fromReaderEither,
      RTE.chain(
        performRTE(this.userRepository.findById, "get user in storage system."),
      ),
      RTE.chainW(RTE.fromOption<Error>(userNotFoundException)),
    )({ logger: this.logger });
    return executeTask(task);
  }
}
