import { Resource } from "@library/contracts";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { userDeleted } from "@modules/user/domain/events/userDeleted.event";
import { userNotFoundException } from "@modules/user/domain/user.errors";
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

export class DeleteUser extends Command {
  constructor(public readonly id: string) {
    super();
  }
}

@CommandHandler(DeleteUser)
export class DeleteUserHandler extends UseCaseHandler<DeleteUser> {
  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  protected logged(command: DeleteUser): unknown {
    return command.id;
  }

  protected pipeline(command: DeleteUser) {
    return FPF.pipe(
      inputRTE(UUID, "id", command.id),

      //Validate User exists
      RTE.chain((key) =>
        orFail(
          perform(this.userRepository).findById(key),
          userNotFoundException,
        ),
      ),

      //Delete entity
      RTE.tap((user) => perform(this.userRepository).deleteById(user.id)),

      RTE.tap(publishRTE(userDeleted)),
      RTE.tap(() => changedRTE({ resource: Resource.Users })),
      RTE.asUnit,
    );
  }
}
