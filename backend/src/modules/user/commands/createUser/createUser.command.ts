import { Resource, UserRequest } from "@library/contracts";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { userCreated } from "@modules/user/domain/events/userCreated.event";
import { PasswordHasher } from "@modules/user/domain/passwordHasher.port";
import { NewUserInput, registerUser } from "@modules/user/domain/user.entity";
import {
  userCPFAlreadyExistsException,
  userEmailAlreadyExistsException,
} from "@modules/user/domain/user.errors";
import { Clock } from "@shared/clock/clock";
import { Command, CommandHandler } from "@shared/utils/application/cqrs";
import { inputsRTE } from "@shared/utils/application/fromInput";
import { FPF, RTE } from "@shared/utils/application/monads";
import { allRTE, orConflict, perform } from "@shared/utils/application/perform";
import {
  changedRTE,
  publishRTE,
  UseCaseHandler,
} from "@shared/utils/application/useCase";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";
import { UUID } from "@shared/uuid/uuid";

export class CreateUser extends Command {
  constructor(public readonly props: UserRequest) {
    super();
  }
}

@CommandHandler(CreateUser)
export class CreateUserHandler extends UseCaseHandler<CreateUser> {
  constructor(
    private readonly clock: Clock,
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {
    super();
  }

  protected logged(command: CreateUser) {
    const { password: _, ...logged } = command.props;
    return logged;
  }

  protected pipeline(command: CreateUser) {
    return FPF.pipe(
      inputsRTE({
        id: [UUID, "uuid", this.uuidGeneratorService.generateUUID()],
        input: [NewUserInput, "User", command.props],
      }),

      //Check cpf and email unicity
      RTE.tap(({ input }) =>
        allRTE({
          cpf: orConflict(
            perform(this.userRepository).findByCPF(input.cpf),
            userCPFAlreadyExistsException,
          ),
          email: orConflict(
            perform(this.userRepository).findByEmail(input.email),
            userEmailAlreadyExistsException,
          ),
        }),
      ),

      //Hash the password and build the user
      RTE.bind("password", ({ input }) =>
        RTE.fromTask(() => this.passwordHasher.hash(input.password)),
      ),
      RTE.map(({ id, input, password }) =>
        registerUser(id, input, password, this.clock.now()),
      ),

      //Store entity
      RTE.tap(perform(this.userRepository).save),

      RTE.tap(publishRTE(userCreated)),
      RTE.tap((user) => changedRTE({ resource: Resource.Users, key: user.id })),
      RTE.asUnit,
    );
  }
}
