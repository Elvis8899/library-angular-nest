import { hashPassword } from "@auth/util/signTokenParams";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { DomainEventPublisher } from "@shared/domain-event-publisher/adapters/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, O, RE, RTE } from "@shared/utils/application/monads";
import { noop } from "@shared/utils/application/noop";
import { performRTE } from "@shared/utils/application/perform";
import { RealUUIDGeneratorService } from "@shared/uuid/adapters/secondaries/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/entities/uuid";
import { UserRepository } from "@user/database/user.repository.port";
import { USER_CREATED } from "@user/domain/events/userCreated.event";
import { User } from "@user/domain/user.entity";
import { userCPFAlreadyExistsException } from "@user/domain/user.errors";
import { CreateUserDto } from "@user/dtos/user.dto";
import { PinoLogger } from "nestjs-pino";

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

      //Encrypt password

      RTE.chainW((user) =>
        FPF.pipe(
          user.password,
          RTE.fromTaskK((v) => () => hashPassword(v)),
          RTE.map((password) => ({ ...user, password })),
        ),
      ),
      //Check cpf unicity
      RTE.tap(
        FPF.flow(
          (user) => user.cpf,
          performRTE(this.userRepository.findByCPF, "get user by cpf"),
          RTE.chainW(
            FPF.flow(
              O.fromPredicate(O.isNone),
              RTE.fromOption(userCPFAlreadyExistsException),
            ),
          ),
        ),
      ),

      //Check email unicity
      RTE.tap(
        FPF.flow(
          (user) => user.email,
          performRTE(this.userRepository.findByEmail, "get user by email"),
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
