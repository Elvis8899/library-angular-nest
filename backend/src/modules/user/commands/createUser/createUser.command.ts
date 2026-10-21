import { hashPassword } from "@modules/auth/utils/password";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { userCreated } from "@modules/user/domain/events/userCreated.event";
import { NewUserInput, registerUser } from "@modules/user/domain/user.entity";
import {
  userCPFAlreadyExistsException,
  userEmailAlreadyExistsException,
} from "@modules/user/domain/user.errors";
import { CreateUserDto } from "@modules/user/dtos/user.dto";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { Apply, FPF, RE, RTE } from "@shared/utils/application/monads";
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
        Apply.sequenceS(RE.Applicative)({
          id: fromInputRE(
            UUID,
            "uuid",
          )(this.uuidGeneratorService.generateUUID()),
          input: fromInputRE(NewUserInput, "User")(command.props),
        }),
        RTE.fromReaderEither,

        //Check cpf and email unicity
        RTE.tap(({ input }) =>
          ensureAbsentRTE(
            this.userRepository.findByCPF,
            "get user by cpf",
            userCPFAlreadyExistsException,
          )(input.cpf),
        ),
        RTE.tap(({ input }) =>
          ensureAbsentRTE(
            this.userRepository.findByEmail,
            "get user by email",
            userEmailAlreadyExistsException,
          )(input.email),
        ),

        //Hash the password and build the user
        RTE.bind("password", ({ input }) =>
          RTE.fromTask(() => hashPassword(input.password)),
        ),
        RTE.map(({ id, input, password }) =>
          registerUser(id, input, password, new Date()),
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
