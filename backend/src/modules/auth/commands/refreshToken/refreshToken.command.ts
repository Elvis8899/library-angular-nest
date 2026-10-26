import { AuthResponse, RefreshTokenRequest } from "@library/contracts";
import { RefreshSessionRepository } from "@modules/auth/database/refreshSession.repository.port";
import { invalidRefreshTokenException } from "@modules/auth/domain/auth.errors";
import {
  RefreshTokenClaims,
  RefreshTokenInput,
} from "@modules/auth/domain/credentials";
import {
  generateTokens,
  refreshSessionExpiry,
  RefreshTokenRef,
  refreshVerifyOptions,
} from "@modules/auth/utils/tokens";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { JwtService } from "@nestjs/jwt";
import { Clock } from "@shared/clock/clock";
import { fromInputRE } from "@shared/utils/application/fromInput";
import { B, E, FPF, RE, RTE, TE } from "@shared/utils/application/monads";
import { findOrFailRTE, performRTE } from "@shared/utils/application/perform";
import { UseCase } from "@shared/utils/application/useCase";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";

export class RefreshTokenCommand implements ICommand {
  constructor(public readonly props: RefreshTokenRequest) {}
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenCommandHandler implements ICommandHandler<
  RefreshTokenCommand,
  AuthResponse
> {
  constructor(
    private readonly useCase: UseCase,
    private readonly userRepository: UserRepository,
    private readonly refreshSessionRepository: RefreshSessionRepository,
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly jwtService: JwtService,
    private readonly clock: Clock,
  ) {}

  execute(command: RefreshTokenCommand): Promise<AuthResponse> {
    // The refresh token is not logged
    return this.useCase.run(
      "RefreshTokenCommand",
      undefined,
      FPF.pipe(
        //Data validation
        RE.of(command.props),
        RE.chain(fromInputRE(RefreshTokenInput, "RefreshTokenInput")),
        RTE.fromReaderEither,

        //Validate refresh token signature, expiration, audience and issuer
        RTE.chainTaskEitherKW(({ refreshToken }) =>
          FPF.pipe(
            TE.tryCatch(
              () =>
                this.jwtService.verifyAsync<object>(
                  refreshToken,
                  refreshVerifyOptions,
                ),
              () => invalidRefreshTokenException(),
            ),
            // Tokens issued before rotation have no session: log in again
            TE.chainEitherKW((payload) =>
              E.tryCatch(
                () => RefreshTokenClaims.parse(payload),
                () => invalidRefreshTokenException(),
              ),
            ),
          ),
        ),

        //Validate User still exists and is active, and the token was not
        //revoked (logout, deactivation or a user update increments the
        //user's token version),
        //then use the user's current data for new tokens
        RTE.chain((claims) =>
          FPF.pipe(
            claims.sub,
            findOrFailRTE(
              this.userRepository.findById,
              "get user by id",
              invalidRefreshTokenException,
            ),
            RTE.filterOrElseW(
              (user) => user.active && user.tokenVersion === claims.ver,
              invalidRefreshTokenException,
            ),
            RTE.bindTo("user"),
            RTE.bindW("next", () => this.rotateSession(claims)),
            // The users list shows each account's last access
            RTE.tap(({ user }) =>
              performRTE(
                this.userRepository.recordAccess,
                "record user access",
              )({ id: user.id, at: this.clock.now() }),
            ),
          ),
        ),
        RTE.chainTaskK(
          ({ user, next }) =>
            () =>
              generateTokens(this.jwtService)(user, next),
        ),
      ),
    );
  }

  // A refresh token is single-use. Using one again means it may have been
  // stolen, so the whole session is revoked: both the attacker and the user
  // have to log in again.
  private rotateSession = ({ sid, jti }: RefreshTokenClaims) => {
    const next: RefreshTokenRef = {
      sessionId: sid,
      jti: this.uuidGeneratorService.generateUUID(),
    };
    return FPF.pipe(
      { id: sid, jti, newJti: next.jti, expiresAt: refreshSessionExpiry() },
      performRTE(this.refreshSessionRepository.rotate, "rotate refresh token"),
      RTE.chainW(
        B.fold(
          () =>
            FPF.pipe(
              sid,
              performRTE(
                this.refreshSessionRepository.deleteById,
                "revoke session of a reused refresh token",
              ),
              RTE.chainW(() => RTE.left(invalidRefreshTokenException())),
            ),
          () => RTE.right(next),
        ),
      ),
    );
  };
}
