import { RealTokenRevocationRepository } from "@modules/auth/database/realTokenRevocation.repository";
import { TokenRevocationRepository } from "@modules/auth/database/tokenRevocation.repository.port";
import { Global, Module } from "@nestjs/common";

/** The revocations AuthGuard reads, wherever a controller uses it. */
@Global()
@Module({
  providers: [
    {
      provide: TokenRevocationRepository,
      useClass: RealTokenRevocationRepository,
    },
  ],
  exports: [TokenRevocationRepository],
})
export class TokenRevocationModule {}
