import { authConfig, jwtModuleOptions } from "@modules/auth/auth.config";
import { LoginCommandHandler } from "@modules/auth/commands/login/login.command";
import { LoginController } from "@modules/auth/commands/login/login.controller";
import { LogoutCommandHandler } from "@modules/auth/commands/logout/logout.command";
import { LogoutController } from "@modules/auth/commands/logout/logout.controller";
import { RefreshTokenCommandHandler } from "@modules/auth/commands/refreshToken/refreshToken.command";
import { RefreshTokenController } from "@modules/auth/commands/refreshToken/refreshToken.controller";
import { RealRefreshSessionRepository } from "@modules/auth/database/realRefreshSession.repository";
import { RefreshSessionRepository } from "@modules/auth/database/refreshSession.repository.port";
import { UserModule } from "@modules/user/user.module";
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";

const controllers = [LoginController, RefreshTokenController, LogoutController];
const commandHandlers = [
  LoginCommandHandler,
  RefreshTokenCommandHandler,
  LogoutCommandHandler,
];
const services = [RealUUIDGeneratorService];
const repositories = [
  {
    provide: RefreshSessionRepository,
    useClass: RealRefreshSessionRepository,
  },
];

@Module({
  imports: [
    CqrsModule,
    // Its UserRepository and PasswordHasher
    UserModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: authConfig.loginRateWindowSeconds * 1000,
          limit: authConfig.loginRateLimit,
        },
      ],
      errorMessage: "Muitas tentativas de login. Tente novamente em instantes.",
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory: jwtModuleOptions,
    }),
  ],
  controllers: [...controllers],
  providers: [...commandHandlers, ...services, ...repositories],
})
export class AuthModule {}
