import { UserRepository } from "@modules/user/database/user.repository.port";
import { User } from "@modules/user/domain/user.entity";
import { userNotFoundException } from "@modules/user/domain/user.errors";
import { Query, QueryHandler } from "@shared/utils/application/cqrs";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { orFail, perform } from "@shared/utils/application/perform";
import { UseCaseHandler } from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class GetUserByIdQuery extends Query<User> {
  constructor(public readonly id: string) {
    super();
  }
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdQueryHandler extends UseCaseHandler<GetUserByIdQuery> {
  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  /**
   * In read model we don't need to execute
   * any business logic, so we can bypass
   * domain and repository layers completely
   * and execute query directly
   */
  protected pipeline(query: GetUserByIdQuery) {
    return FPF.pipe(
      query.id,
      fromInputRE(UUID, "UUID"),
      RTE.fromReaderEither,
      RTE.chain((key) =>
        orFail(
          perform(this.userRepository).findById(key),
          userNotFoundException,
        ),
      ),
    );
  }
}
