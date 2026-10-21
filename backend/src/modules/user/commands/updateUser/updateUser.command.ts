import { hashPassword } from "@modules/auth/utils/password";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { CheckedDocumentType } from "@modules/user/domain/document";
import { userUpdated } from "@modules/user/domain/events/userUpdated.event";
import { User } from "@modules/user/domain/user.entity";
import {
  userCPFAlreadyExistsException,
  userEmailAlreadyExistsException,
  userNotFoundException,
} from "@modules/user/domain/user.errors";
import { CreateUserDto } from "@modules/user/dtos/user.dto";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RE, RTE } from "@shared/utils/application/monads";
import {
  ensureAbsentRTE,
  findOrFailRTE,
  performRTE,
} from "@shared/utils/application/perform";
import { publishRTE, UseCase } from "@shared/utils/application/useCase";
import { UUID } from "@shared/uuid/uuid";

export class UpdateUser implements ICommand {
  constructor(
    public readonly props: CreateUserDto,
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
        RE.of(command.props),
        RE.bind("id", () => fromInputRE(UUID, "uuid")(command.id)),
        RE.chain(fromInputRE(User, "user")),
        RE.tap((user) => fromInputRE(CheckedDocumentType, "cpf")(user.cpf)),
        RTE.fromReaderEither,

        //Validate User exists
        RTE.tap((user) =>
          findOrFailRTE(
            this.userRepository.findById,
            "get user by id",
            userNotFoundException,
          )(user.id),
        ),

        //Encrypt password
        RTE.chainW((user) =>
          FPF.pipe(
            user.password,
            RTE.fromTaskK((v) => () => hashPassword(v)),
            RTE.map((password) => ({ ...user, password })),
          ),
        ),

        //Check cpf and email unicity among the other users
        RTE.tap((user) =>
          ensureAbsentRTE(
            this.userRepository.findByCPF,
            "get user by cpf",
            userCPFAlreadyExistsException,
            (found) => found.id !== user.id,
          )(user.cpf),
        ),
        RTE.tap((user) =>
          ensureAbsentRTE(
            this.userRepository.findByEmail,
            "get user by email",
            userEmailAlreadyExistsException,
            (found) => found.id !== user.id,
          )(user.email),
        ),

        //Store entity
        RTE.tap(
          performRTE(this.userRepository.save, "save user in storage system."),
        ),

        //Revoke existing sessions, as password, role or email may have changed
        RTE.tap((user) =>
          performRTE(
            this.userRepository.incrementTokenVersion,
            "revoke user refresh tokens",
          )(user.id),
        ),

        RTE.tap(publishRTE(userUpdated)),
        RTE.asUnit,
      ),
    );
  }
}
