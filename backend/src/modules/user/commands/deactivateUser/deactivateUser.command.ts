import { Resource } from "@library/contracts";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { userDeactivated } from "@modules/user/domain/events/userDeactivated.event";
import { deactivateUser } from "@modules/user/domain/user.entity";
import { userNotFoundException } from "@modules/user/domain/user.errors";
import { Clock } from "@shared/clock/clock";
import { Command, CommandHandler } from "@shared/utils/application/cqrs";
import { inputRTE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { orFail, perform } from "@shared/utils/application/perform";
import {
  changedRTE,
  publishRTE,
  UseCaseHandler,
} from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class DeactivateUser extends Command {
  constructor(
    public readonly id: string,
    // Who asks, who can't deactivate themselves
    public readonly requesterId: string,
  ) {
    super();
  }
}

@CommandHandler(DeactivateUser)
export class DeactivateUserHandler extends UseCaseHandler<DeactivateUser> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly clock: Clock,
  ) {
    super();
  }

  protected logged(command: DeactivateUser): unknown {
    return command.id;
  }

  protected pipeline(command: DeactivateUser) {
    return FPF.pipe(
      inputRTE(UUID, "id", command.id),

      //Validate User exists
      RTE.chain((key) =>
        orFail(
          perform(this.userRepository).findById(key),
          userNotFoundException,
        ),
      ),
      RTE.chainEitherK(deactivateUser(command.requesterId, this.clock.now())),

      //Store the state alone, ending the account's tokens in the same
      //write, so a concurrent edit neither undoes it nor is undone
      RTE.tap((user) =>
        perform(this.userRepository).deactivate({
          userId: user.id,
          at: user.updatedAt,
        }),
      ),

      RTE.tap(publishRTE(userDeactivated)),
      RTE.tap((user) => changedRTE({ resource: Resource.Users, key: user.id })),
      RTE.asUnit,
    );
  }
}
