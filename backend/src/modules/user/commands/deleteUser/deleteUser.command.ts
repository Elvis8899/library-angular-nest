import { UserRepository } from "@modules/user/database/user.repository.port";
import { userDeleted } from "@modules/user/domain/events/userDeleted.event";
import { userNotFoundException } from "@modules/user/domain/user.errors";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { findOrFailRTE, performRTE } from "@shared/utils/application/perform";
import { publishRTE, UseCase } from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class DeleteUser implements ICommand {
  constructor(public readonly props: string) {}
}

@CommandHandler(DeleteUser)
export class DeleteUserHandler implements ICommandHandler<DeleteUser, void> {
  constructor(
    private readonly useCase: UseCase,
    private readonly userRepository: UserRepository,
  ) {}

  execute(command: DeleteUser): Promise<void> {
    return this.useCase.run(
      "DeleteUser",
      command.props,
      FPF.pipe(
        //Data validation
        command.props,
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

        //Delete entity
        RTE.tap((user) =>
          performRTE(
            this.userRepository.deleteById,
            "delete user in storage system.",
          )(user.id),
        ),

        RTE.tap(publishRTE(userDeleted)),
        RTE.asUnit,
      ),
    );
  }
}
