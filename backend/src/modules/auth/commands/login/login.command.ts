import { AuthResponse, LoginRequest } from "@library/contracts";
import { RefreshSessionRepository } from "@modules/auth/database/refreshSession.repository.port";
import {
  accountDeactivatedException,
  wrongAuthException,
} from "@modules/auth/domain/auth.errors";
import { LoginInput } from "@modules/auth/domain/credentials";
import {
  generateTokens,
  refreshSessionExpiry,
  RefreshTokenRef,
} from "@modules/auth/utils/tokens";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { PasswordHasher } from "@modules/user/domain/passwordHasher.port";
import { JwtService } from "@nestjs/jwt";
import { Clock } from "@shared/clock/clock";
import { Command, CommandHandler } from "@shared/utils/application/cqrs";
import { inputRTE } from "@shared/utils/application/fromInput";
import { B, FPF, RTE, TE } from "@shared/utils/application/monads";
import { orFail, perform } from "@shared/utils/application/perform";
import { UseCaseHandler } from "@shared/utils/application/useCase";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";

export class LoginCommand extends Command<AuthResponse> {
  constructor(public readonly props: LoginRequest) {
    super();
  }
}

@CommandHandler(LoginCommand)
export class LoginCommandHandler extends UseCaseHandler<LoginCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly refreshSessionRepository: RefreshSessionRepository,
    private readonly uuidGeneratorService: RealUUIDGeneratorService,
    private readonly jwtService: JwtService,
    private readonly clock: Clock,
  ) {
    super();
  }

  protected logged(command: LoginCommand): unknown {
    return { email: command.props.email };
  }

  protected pipeline(command: LoginCommand) {
    return FPF.pipe(
      inputRTE(LoginInput, "LoginInput", command.props),

      //Validate User exists
      RTE.chain((data) =>
        orFail(
          perform(this.userRepository).findByEmail(data.email),
          wrongAuthException,
        ),
      ),

      // Validate password
      RTE.chainTaskEitherKW((user) =>
        FPF.pipe(
          () =>
            this.passwordHasher.matches(command.props.password, user.password),
          TE.fromTask,
          TE.chainW(
            B.fold(
              () => TE.left(wrongAuthException()),
              () => TE.right(user),
            ),
          ),
        ),
      ),
      // Checked after the password, so only the account's owner learns it
      RTE.filterOrElseW((user) => user.active, accountDeactivatedException),
      // A hash weaker than new ones is replaced, now the password is known
      RTE.tap((user) =>
        this.passwordHasher.needsRehash(user.password)
          ? FPF.pipe(
              RTE.fromTask(() =>
                this.passwordHasher.hash(command.props.password),
              ),
              RTE.chain((password) =>
                perform(this.userRepository).save({ ...user, password }),
              ),
            )
          : RTE.right(undefined),
      ),
      RTE.tap((user) => this.recordAccess(user.id)),
      RTE.bindTo("user"),
      RTE.bindW("session", ({ user }) => this.startSession(user.id)),
      RTE.chainTaskK(
        ({ user, session }) =>
          () =>
            generateTokens(this.jwtService)(user, session),
      ),
    );
  }

  // The users list shows each account's last access
  private recordAccess = (id: string) =>
    perform(this.userRepository).recordAccess({ id, at: this.clock.now() });

  // Each login starts a refresh session; the user's expired ones are
  // removed at the same time
  private startSession = (userId: string) => {
    const session: RefreshTokenRef = {
      sessionId: this.uuidGeneratorService.generateUUID(),
      jti: this.uuidGeneratorService.generateUUID(),
    };
    return FPF.pipe(
      perform(this.refreshSessionRepository).deleteExpired(userId),
      RTE.chainW(() =>
        FPF.pipe(
          perform(this.refreshSessionRepository).create({
            id: session.sessionId,
            userId,
            currentJti: session.jti,
            expiresAt: refreshSessionExpiry(),
          }),
        ),
      ),
      RTE.map(() => session),
    );
  };
}
