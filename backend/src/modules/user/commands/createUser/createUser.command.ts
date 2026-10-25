import { UserRequest } from "@library/contracts";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { userCreated } from "@modules/user/domain/events/userCreated.event";
import { PasswordHasher } from "@modules/user/domain/passwordHasher.port";
import { NewUserInput, registerUser } from "@modules/user/domain/user.entity";
import {
  userCPFAlreadyExistsException,
  userEmailAlreadyExistsException,
} from "@modules/user/domain/user.errors";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { Clock } from "@shared/clock/clock";
import { inputsRTE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { ensureAbsentRTE, performRTE } from "@shared/utils/application/perform";
import { publishRTE, UseCase } from "@shared/utils/application/useCase";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/uuid";

export class CreateUser implements ICommand {
  constructor(public readonly props: UserRequest) {}
}

@CommandHandler(CreateUser)
export class CreateUserHandler implements ICommandHandler<CreateUser, void> {
  constructor(
    private readonly useCase: UseCase,
    private readonly clock: Clock,
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  execute(command: CreateUser): Promise<void> {
    const { password: _, ...logged } = command.props;
    return this.useCase.run(
      "CreateUser",
      logged,
      FPF.pipe(
        //Data validation
        inputsRTE({
          id: [UUID, "uuid", this.uuidGeneratorService.generateUUID()],
          input: [NewUserInput, "User", command.props],
        }),

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
          RTE.fromTask(() => this.passwordHasher.hash(input.password)),
        ),
        RTE.map(({ id, input, password }) =>
          registerUser(id, input, password, this.clock.now()),
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
