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
import {
  userCPFAlreadyExistsException,
  userNotFoundException,
} from "../../domain/user.errors";
import { USER_UPDATED } from "../../domain/events/userUpdated.event";

export class UpdateUser implements ICommand {
  constructor(
    public readonly props: CreateUserDto,
    public readonly id: string,
  ) {}
}

@CommandHandler(UpdateUser)
export class UpdateUserHandler implements ICommandHandler<UpdateUser, void> {
  constructor(
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly userRepository: UserRepository,
    private readonly domainEventPublisher: DomainEventPublisher,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("UpdateUser");
  }

  execute(command: UpdateUser): Promise<void> {
    this.logger.info(command.props, "UpdateUser command received");
    const task = FPF.pipe(
      //Data validation
      RE.of(command.props),
      RE.bind("id", () => fromInputRE(UUID, "uuid")(command.id)),
      RE.chain(fromInputRE(User, "user")),
      RTE.fromReaderEither,

      //Validate User exists
      RTE.tap(
        FPF.flow(
          (data) => data.id,
          performRTE(this.userRepository.findOneById, "get user by id"),
          RTE.chainW(RTE.fromOption<Error>(userNotFoundException)),
        ),
      ),

      // Check cpf unicity
      RTE.tap((validatedDatas) =>
        FPF.pipe(
          validatedDatas,
          (user) => user.cpf,
          performRTE(this.userRepository.findOneByCPF, "get user by cpf"),
          RTE.chainW(
            FPF.flow(
              O.filter((user) => user.id !== validatedDatas.id),
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

      //Emit domain event
      RTE.chain((user) =>
        performRTE(
          this.domainEventPublisher.publishEvent,
          "emit user Updated event.",
        )({
          eventKey: USER_UPDATED,
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
