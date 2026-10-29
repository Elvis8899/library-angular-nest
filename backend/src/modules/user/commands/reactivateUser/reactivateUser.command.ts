import { Resource } from "@library/contracts";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { userReactivated } from "@modules/user/domain/events/userReactivated.event";
import { reactivateUser } from "@modules/user/domain/user.entity";
import { userNotFoundException } from "@modules/user/domain/user.errors";
import { Clock } from "@shared/clock/clock";
import { Command, CommandHandler } from "@shared/utils/application/cqrs";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { orFail, perform } from "@shared/utils/application/perform";
import {
  changedRTE,
  publishRTE,
  UseCaseHandler,
} from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class ReactivateUser extends Command {
  constructor(public readonly id: string) {
    super();
  }
}

@CommandHandler(ReactivateUser)
export class ReactivateUserHandler extends UseCaseHandler<ReactivateUser> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly clock: Clock,
  ) {
    super();
  }

  protected logged(command: ReactivateUser): unknown {
    return command.id;
  }

  protected pipeline(command: ReactivateUser) {
    return FPF.pipe(
      //Data validation
      command.id,
      fromInputRE(UUID, "id"),
      RTE.fromReaderEither,

      //Validate User exists
      RTE.chain((key) =>
        orFail(
          perform(this.userRepository).findById(key),
          userNotFoundException,
        ),
      ),
      RTE.map(reactivateUser(this.clock.now())),

      //Store the state alone, as deactivating does
      RTE.tap((user) =>
        perform(this.userRepository).reactivate({
          userId: user.id,
          at: user.updatedAt,
        }),
      ),

      RTE.tap(publishRTE(userReactivated)),
      RTE.tap((user) => changedRTE({ resource: Resource.Users, key: user.id })),
      RTE.asUnit,
    );
  }
}
