import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { FPF, O, RE, RTE } from "@shared/functional/monads";
import { performRTE } from "@shared/utils/perform";
import { executeTask } from "@shared/utils/executeTask";
import { fromInputRE } from "@src/shared/utils/fromInput";
import { noop } from "@shared/utils/noop";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { PinoLogger } from "nestjs-pino";
import { UserRepository } from "../../database/user.repository.port";
import { RealUUIDGeneratorService } from "@src/shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { CreateUserDto } from "../../dtos/user.dto";
import { UUID } from "@src/shared/uuid/entities/uuid";
import { User } from "../../domain/user.entity";
import { userCPFAlreadyExistsException } from "../../domain/user.errors";
import { USER_CREATED } from "../../domain/events/userCreated.event";

export class CreateUser implements ICommand {
  constructor(public readonly props: CreateUserDto) {}
}

@CommandHandler(CreateUser)
export class CreateUserHandler implements ICommandHandler<CreateUser, void> {
  constructor(
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly userRepository: UserRepository,
    private readonly domainEventPublisher: DomainEventPublisher,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("CreateUser");
  }

  execute(command: CreateUser): Promise<void> {
    this.logger.info(command.props, "CreateUser command received");
    const task = FPF.pipe(
      //Data validation
      RE.of(command.props),
      RE.bind("id", () =>
        fromInputRE(UUID, "uuid")(this.uuidGeneratorService.generateUUID()),
      ),
      RE.chain(fromInputRE(User, "User")),
      RTE.fromReaderEither,

      //Check cpf unicity
      RTE.tap(
        FPF.flow(
          (user) => user.cpf,
          performRTE(this.userRepository.findOneByCPF, "get user by cpf"),
          RTE.chainW(
            FPF.flow(
              O.fromPredicate(O.isNone),
              RTE.fromOption(userCPFAlreadyExistsException),
            ),
          ),
        ),
      ),

      //Store entity
      RTE.tap(
        performRTE(this.userRepository.save, "save user in storage system."),
      ),

      // //Emit domain event
      RTE.chain((user) =>
        performRTE(
          this.domainEventPublisher.publishEvent,
          "emit user created event.",
        )({
          eventKey: USER_CREATED,
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
