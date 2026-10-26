import { Resource } from "@library/contracts";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { userReactivated } from "@modules/user/domain/events/userReactivated.event";
import { reactivateUser } from "@modules/user/domain/user.entity";
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

export class ReactivateUser implements ICommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(ReactivateUser)
export class ReactivateUserHandler implements ICommandHandler<
  ReactivateUser,
  void
> {
  constructor(
    private readonly useCase: UseCase,
    private readonly userRepository: UserRepository,
    private readonly clock: Clock,
  ) {}

  execute(command: ReactivateUser): Promise<void> {
    return this.useCase.run(
      "ReactivateUser",
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
        RTE.map(reactivateUser(this.clock.now())),

        //Store entity
        RTE.tap(
          performRTE(this.userRepository.save, "save user in storage system."),
        ),

        RTE.tap(publishRTE(userReactivated)),
        RTE.tap((user) =>
          changedRTE({ resource: Resource.Users, key: user.id }),
        ),
        RTE.asUnit,
      ),
    );
  }
}
