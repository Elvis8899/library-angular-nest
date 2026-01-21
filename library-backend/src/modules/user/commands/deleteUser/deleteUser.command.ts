import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { FPF, RTE } from "@shared/functional/monads";
import { performRTE } from "@shared/utils/perform";
import { executeTask } from "@shared/utils/executeTask";
import { noop } from "@shared/utils/noop";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { PinoLogger } from "nestjs-pino";
import { UserRepository } from "../../database/user.repository.port";
import { RealUUIDGeneratorService } from "@src/shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { UUID } from "@src/shared/uuid/entities/uuid";
import { fromInputRE } from "@src/shared/utils/fromInput";
import { userNotFoundException } from "../../domain/user.errors";
import { USER_DELETED } from "../../domain/events/userDeleted.event";

export class DeleteUser implements ICommand {
  constructor(public readonly props: string) {}
}

@CommandHandler(DeleteUser)
export class DeleteUserHandler implements ICommandHandler<DeleteUser, void> {
  constructor(
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly userRepository: UserRepository,
    private readonly domainEventPublisher: DomainEventPublisher,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("DeleteUser");
  }

  execute(command: DeleteUser): Promise<void> {
    this.logger.info(command.props, "DeleteUser command received");
    const task = FPF.pipe(
      //Data validation
      command.props,
      fromInputRE(UUID, "id"),
      RTE.fromReaderEither,

      // Validate User exists
      RTE.chain(
        FPF.flow(
          performRTE(this.userRepository.findOneById, "get user by id"),
          RTE.chain((_) => RTE.fromOption<Error>(userNotFoundException)(_)),
        ),
      ),

      // Delete entity
      RTE.tap((existingUser) =>
        performRTE(
          this.userRepository.deleteById,
          "delete user in storage system.",
        )(existingUser.id),
      ),

      // Emit domain event
      RTE.chain((user) =>
        performRTE(
          this.domainEventPublisher.publishEvent,
          "emit user deleted event.",
        )({
          eventKey: USER_DELETED,
          payload: {
            id: user.id,
            name: user.name,
          },
        }),
      ),
      RTE.map(noop),
    )({ logger: this.logger });
    return executeTask(task);
  }
}
