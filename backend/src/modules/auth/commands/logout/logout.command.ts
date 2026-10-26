import { UserRepository } from "@modules/user/database/user.repository.port";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { Clock } from "@shared/clock/clock";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { performRTE } from "@shared/utils/application/perform";
import { UseCase } from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class LogoutCommand implements ICommand {
  constructor(public readonly userId: string) {}
}

/** Revokes every token issued to the user, on every device. */
@CommandHandler(LogoutCommand)
export class LogoutCommandHandler implements ICommandHandler<
  LogoutCommand,
  void
> {
  constructor(
    private readonly useCase: UseCase,
    private readonly userRepository: UserRepository,
    private readonly clock: Clock,
  ) {}

  execute(command: LogoutCommand): Promise<void> {
    return this.useCase.run(
      "LogoutCommand",
      command.userId,
      FPF.pipe(
        command.userId,
        fromInputRE(UUID, "uuid"),
        RTE.fromReaderEither,
        RTE.chain((userId) =>
          performRTE(
            this.userRepository.revokeTokens,
            "revoke user tokens",
          )({ userId, at: this.clock.now() }),
        ),
      ),
    );
  }
}
