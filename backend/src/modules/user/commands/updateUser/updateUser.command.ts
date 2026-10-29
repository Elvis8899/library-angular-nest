import { Resource, UserChangesRequest } from "@library/contracts";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { userUpdated } from "@modules/user/domain/events/userUpdated.event";
import { PasswordHasher } from "@modules/user/domain/passwordHasher.port";
import {
  changeUserDetails,
  endsSessions,
  UserChangesInput,
} from "@modules/user/domain/user.entity";
import {
  userCPFAlreadyExistsException,
  userEmailAlreadyExistsException,
  userNotFoundException,
} from "@modules/user/domain/user.errors";
import { Clock } from "@shared/clock/clock";
import { Command, CommandHandler } from "@shared/utils/application/cqrs";
import { inputsRTE } from "@shared/utils/application/fromInput";
import { FPF, O, RTE, T } from "@shared/utils/application/monads";
import {
  allRTE,
  orConflict,
  orFail,
  perform,
} from "@shared/utils/application/perform";
import {
  changedRTE,
  publishRTE,
  UseCaseHandler,
} from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class UpdateUser extends Command {
  constructor(
    public readonly props: UserChangesRequest,
    public readonly id: string,
  ) {
    super();
  }
}

@CommandHandler(UpdateUser)
export class UpdateUserHandler extends UseCaseHandler<UpdateUser> {
  constructor(
    private readonly clock: Clock,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {
    super();
  }

  protected logged(command: UpdateUser) {
    const { password: _, ...logged } = command.props;
    return { id: command.id, ...logged };
  }

  protected pipeline(command: UpdateUser) {
    return FPF.pipe(
      //Data validation
      inputsRTE({
        id: [UUID, "uuid", command.id],
        changes: [UserChangesInput, "user", command.props],
      }),

      //Validate User exists
      RTE.bind("before", ({ id }) =>
        orFail(
          perform(this.userRepository).findById(id),
          userNotFoundException,
        ),
      ),

      //Check cpf and email unicity among the other users
      RTE.tap(({ id, changes }) =>
        allRTE({
          cpf: orConflict(
            perform(this.userRepository).findByCPF(changes.cpf),
            userCPFAlreadyExistsException,
            (found) => found.id !== id,
          ),
          email: orConflict(
            perform(this.userRepository).findByEmail(changes.email),
            userEmailAlreadyExistsException,
            (found) => found.id !== id,
          ),
        }),
      ),

      //Hash the new password, if any, and apply the changes
      RTE.bind("password", ({ changes }) =>
        RTE.fromTask(
          FPF.pipe(
            O.fromNullable(changes.password),
            O.traverse(T.ApplicativePar)(
              (password) => () => this.passwordHasher.hash(password),
            ),
          ),
        ),
      ),
      RTE.let("after", ({ before, changes, password }) =>
        changeUserDetails(changes, password, this.clock.now())(before),
      ),

      //Store entity
      RTE.tap(({ after }) => perform(this.userRepository).save(after)),

      //Revoke existing sessions if the tokens' email or role, or the
      //password changed
      RTE.tap(({ before, after }) =>
        endsSessions(before, after)
          ? perform(this.userRepository).revokeTokens({
              userId: after.id,
              at: after.updatedAt,
            })
          : RTE.right(undefined),
      ),

      RTE.map(({ after }) => after),
      RTE.tap(publishRTE(userUpdated)),
      RTE.tap((user) => changedRTE({ resource: Resource.Users, key: user.id })),
      RTE.asUnit,
    );
  }
}
