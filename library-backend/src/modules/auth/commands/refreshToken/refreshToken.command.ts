import { invalidRefreshTokenException } from "@auth/domain/auth.errors";
import {
  RefreshJWTPayload,
  RefreshTokenInput,
} from "@auth/domain/login.entity";
import { AuthResponseDto } from "@auth/dtos/authResponse.dto";
import { RefreshTokenDto } from "@auth/dtos/refreshToken.dto";
import {
  generateTokens,
  refreshVerifyOptions,
} from "@auth/util/signTokenParams";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { JwtService } from "@nestjs/jwt";
import { executeTask } from "@shared/utils/application/executeTask";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { FPF, RE, RTE, TE } from "@shared/utils/application/monads";
import { performRTE } from "@shared/utils/application/perform";
import { UserRepository } from "@user/database/user.repository.port";
import { PinoLogger } from "nestjs-pino";

export class RefreshTokenCommand implements ICommand {
  constructor(public readonly props: RefreshTokenDto) {}
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenCommandHandler implements ICommandHandler<
  RefreshTokenCommand,
  AuthResponseDto
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("RefreshTokenCommand");
  }

  execute(command: RefreshTokenCommand): Promise<AuthResponseDto> {
    this.logger.info("RefreshTokenCommand command received");
    const task = FPF.pipe(
      //Data validation
      RE.of(command.props),
      RE.chain(fromInputRE(RefreshTokenInput, "RefreshTokenInput")),
      RTE.fromReaderEither,

      //Validate refresh token signature, expiration, audience and issuer
      RTE.chainTaskEitherKW(({ refreshToken }) =>
        TE.tryCatch(
          () =>
            this.jwtService.verifyAsync<RefreshJWTPayload>(
              refreshToken,
              refreshVerifyOptions,
            ),
          () => invalidRefreshTokenException(),
        ),
      ),

      //Validate User still exists and the token was not revoked
      //(logout or user update increments the user's token version),
      //then use the user's current data for new tokens
      RTE.chain((payload) =>
        FPF.pipe(
          payload.sub,
          performRTE(this.userRepository.findById, "get user by id"),
          RTE.chainW(RTE.fromOption<Error>(invalidRefreshTokenException)),
          RTE.filterOrElseW(
            (user) => user.tokenVersion === payload.ver,
            invalidRefreshTokenException,
          ),
        ),
      ),
      RTE.chainTaskK((user) => () => generateTokens(this.jwtService)(user)),
    )({ logger: this.logger });
    return executeTask(task);
  }
}
