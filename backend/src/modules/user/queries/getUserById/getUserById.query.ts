import { UserRepository } from "@modules/user/database/user.repository.port";
import { User } from "@modules/user/domain/user.entity";
import { userNotFoundException } from "@modules/user/domain/user.errors";
import { IQuery, IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { findOrFailRTE } from "@shared/utils/application/perform";
import { UseCase } from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class GetUserByIdQuery implements IQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdQueryHandler implements IQueryHandler<
  GetUserByIdQuery,
  User
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
  execute(query: GetUserByIdQuery): Promise<User> {
    return this.useCase.run(
      "GetUserById",
      query,
      FPF.pipe(
        query.id,
        fromInputRE(UUID, "UUID"),
        RTE.fromReaderEither,
        RTE.chain(
          findOrFailRTE(
            this.userRepository.findById,
            "get user in storage system.",
            userNotFoundException,
          ),
        ),
      ),
    );
  }
}
