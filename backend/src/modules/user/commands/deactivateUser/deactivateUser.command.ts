import { Resource } from "@library/contracts";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { userDeactivated } from "@modules/user/domain/events/userDeactivated.event";
import { deactivateUser } from "@modules/user/domain/user.entity";
import { userNotFoundException } from "@modules/user/domain/user.errors";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { Clock } from "@shared/clock/clock";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { findOrFailRTE, performRTE } from "@shared/utils/application/perform";
import {
  changedRTE,
  publishRTE,
  UseCase,
} from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class DeactivateUser implements ICommand {
  constructor(
    public readonly id: string,
    // Who asks, who can't deactivate themselves
    public readonly requesterId: string,
  ) {}
}

@CommandHandler(DeactivateUser)
export class DeactivateUserHandler implements ICommandHandler<
  DeactivateUser,
  void
> {
  constructor(
    private readonly useCase: UseCase,
    private readonly userRepository: UserRepository,
    private readonly clock: Clock,
  ) {}

  execute(command: DeactivateUser): Promise<void> {
    return this.useCase.run(
      "DeactivateUser",
      command.id,
      FPF.pipe(
        //Data validation
        command.id,
        fromInputRE(UUID, "id"),
        RTE.fromReaderEither,

        //Validate User exists
        RTE.chain(
          findOrFailRTE(
            this.userRepository.findById,
            "get user by id",
            userNotFoundException,
          ),
        ),
        RTE.chainEitherK(
          deactivateUser(command.requesterId, this.clock.now()),
        ),

        //Store entity
        RTE.tap(
          performRTE(this.userRepository.save, "save user in storage system."),
        ),

        //A deactivated account can't refresh its tokens
        RTE.tap((user) =>
          performRTE(
            this.userRepository.incrementTokenVersion,
            "revoke user refresh tokens",
          )(user.id),
        ),

        RTE.tap(publishRTE(userDeactivated)),
        RTE.tap((user) =>
          changedRTE({ resource: Resource.Users, key: user.id }),
        ),
        RTE.asUnit,
      ),
    );
  }
}
