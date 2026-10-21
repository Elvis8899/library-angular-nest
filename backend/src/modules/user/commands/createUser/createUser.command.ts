import { hashPassword } from "@modules/auth/utils/password";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { CheckedDocumentType } from "@modules/user/domain/document";
import { userCreated } from "@modules/user/domain/events/userCreated.event";
import { User } from "@modules/user/domain/user.entity";
import {
  userCPFAlreadyExistsException,
  userEmailAlreadyExistsException,
} from "@modules/user/domain/user.errors";
import { CreateUserDto } from "@modules/user/dtos/user.dto";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RE, RTE } from "@shared/utils/application/monads";
import { ensureAbsentRTE, performRTE } from "@shared/utils/application/perform";
import { publishRTE, UseCase } from "@shared/utils/application/useCase";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/uuid";

export class CreateUser implements ICommand {
  constructor(public readonly props: CreateUserDto) {}
}

@CommandHandler(CreateUser)
export class CreateUserHandler implements ICommandHandler<CreateUser, void> {
  constructor(
    private readonly useCase: UseCase,
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly userRepository: UserRepository,
  ) {}

  execute(command: CreateUser): Promise<void> {
    const { password: _, ...logged } = command.props;
    return this.useCase.run(
      "CreateUser",
      logged,
      FPF.pipe(
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

        //Check cpf and email unicity
        RTE.tap((user) =>
          ensureAbsentRTE(
            this.userRepository.findByCPF,
            "get user by cpf",
            userCPFAlreadyExistsException,
          )(user.cpf),
        ),
        RTE.tap((user) =>
          ensureAbsentRTE(
            this.userRepository.findByEmail,
            "get user by email",
            userEmailAlreadyExistsException,
          )(user.email),
        ),

        //Store entity
        RTE.tap(
          performRTE(this.userRepository.save, "save user in storage system."),
        ),

        RTE.tap(publishRTE(userCreated)),
        RTE.asUnit,
      ),
    );
  }
}
