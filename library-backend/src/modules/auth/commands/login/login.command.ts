import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { B, FPF, RE, RTE, TE } from "@shared/functional/monads";
import { performRTE } from "@shared/utils/perform";
import { executeTask } from "@shared/utils/executeTask";
import { fromInputRE } from "@src/shared/utils/fromInput";
import { PinoLogger } from "nestjs-pino";
import { UserRepository } from "@src/modules/user/database/user.repository.port";
import { LoginDto } from "../../dtos/login.dto";
import { LoginInput } from "../../domain/login.entity";
import { wrongAuthException } from "../../domain/auth.errors";
import { AuthResponseDto } from "../../dtos/authResponse.dto";
import { JwtService } from "@nestjs/jwt";
import { User } from "@src/modules/user/domain/user.entity";
import {
  comparePassword,
  getSignTokenParams,
} from "../../util/signTokenParams";

export class LoginCommand implements ICommand {
  constructor(public readonly props: LoginDto) {}
}

@CommandHandler(LoginCommand)
export class LoginCommandHandler
  implements ICommandHandler<LoginCommand, AuthResponseDto>
{
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
      RTE.chainTaskK((user) => () => this.generateTokens(user)),
    )({ logger: this.logger });
    return executeTask(task);
  }

  public async generateTokens(user: User): Promise<AuthResponseDto> {
    const { payload, signOptions, refreshOptions } = getSignTokenParams(
      user.id,
      {
        email: user.email,
        role: user.role,
      },
    );
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, signOptions),
      this.jwtService.signAsync(payload, refreshOptions),
    ]);
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
