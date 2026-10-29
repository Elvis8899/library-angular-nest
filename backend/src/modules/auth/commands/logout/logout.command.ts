import { UserRepository } from "@modules/user/database/user.repository.port";
import { Clock } from "@shared/clock/clock";
import { Command, CommandHandler } from "@shared/utils/application/cqrs";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { perform } from "@shared/utils/application/perform";
import { UseCaseHandler } from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class LogoutCommand extends Command {
  constructor(public readonly userId: string) {
    super();
  }
}

/** Revokes every token issued to the user, on every device. */
@CommandHandler(LogoutCommand)
export class LogoutCommandHandler extends UseCaseHandler<LogoutCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly clock: Clock,
  ) {
    super();
  }

  protected logged(command: LogoutCommand): unknown {
    return command.userId;
  }

  protected pipeline(command: LogoutCommand) {
    return FPF.pipe(
      command.userId,
      fromInputRE(UUID, "uuid"),
      RTE.fromReaderEither,
      RTE.chain((userId) =>
        perform(this.userRepository).revokeTokens({
          userId,
          at: this.clock.now(),
        }),
      ),
    );
  }
}
