import { wrongAuthException } from "@auth/domain/auth.errors";
import { LoginInput } from "@auth/domain/login.entity";
import { AuthResponseDto } from "@auth/dtos/authResponse.dto";
import { LoginDto } from "@auth/dtos/login.dto";
import { comparePassword, generateTokens } from "@auth/util/signTokenParams";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { JwtService } from "@nestjs/jwt";
import { executeTask } from "@shared/utils/application/executeTask";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { B, FPF, RE, RTE, TE } from "@shared/utils/application/monads";
import { performRTE } from "@shared/utils/application/perform";
import { UserRepository } from "@user/database/user.repository.port";
import { PinoLogger } from "nestjs-pino";

export class LoginCommand implements ICommand {
  constructor(public readonly props: LoginDto) {}
}

@CommandHandler(LoginCommand)
export class LoginCommandHandler implements ICommandHandler<
  LoginCommand,
  AuthResponseDto
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("LoginCommand");
  }

  execute(command: LoginCommand): Promise<AuthResponseDto> {
    this.logger.info(command.props, "LoginCommand command received");
    const task = FPF.pipe(
      //Data validation
      RE.of(command.props),

      RE.chain(fromInputRE(LoginInput, "LoginInput")),
      RTE.fromReaderEither,

      //Validate User exists
      RTE.chain((data) =>
        FPF.pipe(
          data.email,
          performRTE(this.userRepository.findByEmail, "get user by id"),
          RTE.chainW(RTE.fromOption<Error>(wrongAuthException)),
        ),
      ),

      // Validate password
      RTE.chainTaskEitherKW((user) =>
        FPF.pipe(
          () => comparePassword(command.props.password, user.password),
          TE.fromTask,
          TE.chainW(
            B.fold(
              () => TE.left(wrongAuthException()),
              () => TE.right(user),
            ),
          ),
        ),
      ),
      RTE.chainTaskK((user) => () => generateTokens(this.jwtService)(user)),
    )({ logger: this.logger });
    return executeTask(task);
  }
}
