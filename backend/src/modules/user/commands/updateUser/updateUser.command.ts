import { hashPassword } from "@modules/auth/utils/password";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { userUpdated } from "@modules/user/domain/events/userUpdated.event";
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
import { UpdateUserDto } from "@modules/user/dtos/user.dto";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { Apply, FPF, O, RE, RTE, T } from "@shared/utils/application/monads";
import {
  ensureAbsentRTE,
  findOrFailRTE,
  performRTE,
} from "@shared/utils/application/perform";
import { publishRTE, UseCase } from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class UpdateUser implements ICommand {
  constructor(
    public readonly props: UpdateUserDto,
    public readonly id: string,
  ) {}
}

@CommandHandler(UpdateUser)
export class UpdateUserHandler implements ICommandHandler<UpdateUser, void> {
  constructor(
    private readonly useCase: UseCase,
    private readonly userRepository: UserRepository,
  ) {}

  execute(command: UpdateUser): Promise<void> {
    const { password: _, ...logged } = command.props;
    return this.useCase.run(
      "UpdateUser",
      logged,
      FPF.pipe(
        //Data validation
        Apply.sequenceS(RE.Applicative)({
          id: fromInputRE(UUID, "uuid")(command.id),
          changes: fromInputRE(UserChangesInput, "user")(command.props),
        }),
        RTE.fromReaderEither,

        //Validate User exists
        RTE.bind("before", ({ id }) =>
          findOrFailRTE(
            this.userRepository.findById,
            "get user by id",
            userNotFoundException,
          )(id),
        ),

        //Check cpf and email unicity among the other users
        RTE.tap(({ id, changes }) =>
          ensureAbsentRTE(
            this.userRepository.findByCPF,
            "get user by cpf",
            userCPFAlreadyExistsException,
            (found) => found.id !== id,
          )(changes.cpf),
        ),
        RTE.tap(({ id, changes }) =>
          ensureAbsentRTE(
            this.userRepository.findByEmail,
            "get user by email",
            userEmailAlreadyExistsException,
            (found) => found.id !== id,
          )(changes.email),
        ),

        //Hash the new password, if any, and apply the changes
        RTE.bind("password", ({ changes }) =>
          RTE.fromTask(
            FPF.pipe(
              O.fromNullable(changes.password),
              O.traverse(T.ApplicativePar)(
                (password) => () => hashPassword(password),
              ),
            ),
          ),
        ),
        RTE.let("after", ({ before, changes, password }) =>
          changeUserDetails(changes, password, new Date())(before),
        ),

        //Store entity
        RTE.tap(({ after }) =>
          performRTE(
            this.userRepository.save,
            "save user in storage system.",
          )(after),
        ),

        //Revoke existing sessions if the tokens' email or role, or the
        //password changed
        RTE.tap(({ before, after }) =>
          endsSessions(before, after)
            ? performRTE(
                this.userRepository.incrementTokenVersion,
                "revoke user refresh tokens",
              )(after.id)
            : RTE.right(undefined),
        ),

        RTE.map(({ after }) => after),
        RTE.tap(publishRTE(userUpdated)),
        RTE.asUnit,
      ),
    );
  }
}
