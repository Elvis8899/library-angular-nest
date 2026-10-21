import { hashPassword } from "@modules/auth/utils/password";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { CheckedDocumentType } from "@modules/user/domain/document";
import { USER_CREATED } from "@modules/user/domain/events/userCreated.event";
import { User } from "@modules/user/domain/user.entity";
import {
  userCPFAlreadyExistsException,
  userEmailAlreadyExistsException,
} from "@modules/user/domain/user.errors";
import { CreateUserDto } from "@modules/user/dtos/user.dto";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, O, RE, RTE } from "@shared/utils/application/monads";
import { performRTE } from "@shared/utils/application/perform";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/uuid";
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
      RE.tap((user) => fromInputRE(CheckedDocumentType, "cpf")(user.cpf)),

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
              RTE.fromOption(userEmailAlreadyExistsException),
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
      RTE.asUnit,
    )({ logger: this.logger });
    return executeTask(task);
  }
}
