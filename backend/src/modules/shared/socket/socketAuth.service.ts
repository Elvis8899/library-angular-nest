import { TokenRevocationRepository } from "@modules/auth/database/tokenRevocation.repository.port";
import { isRevoked } from "@modules/auth/domain/tokenRevocation.entity";
import { RequestJWTPayload } from "@modules/auth/guards/authenticatedRequest";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { executeTask } from "@shared/utils/application/executeTask";
import { z } from "zod";

const HandshakeAuth = z.object({ token: z.string().min(1) });

@Injectable()
export class SocketAuthService {
  constructor(
    private jwtService: JwtService,
    private revocations: TokenRevocationRepository,
  ) {}

  /**
   * The claims of the access token a handshake sends (`auth.token`),
   * verified as AuthGuard does, with the JwtModule's secret, audience and
   * issuer. Rejects a missing, invalid or revoked token.
   */
  async authenticate(handshakeAuth: unknown): Promise<RequestJWTPayload> {
    const auth = HandshakeAuth.safeParse(handshakeAuth);
    if (!auth.success) throw new UnauthorizedException();
    const payload = await this.jwtService.verifyAsync<RequestJWTPayload>(
      auth.data.token,
    );
    const revocation = await executeTask(
      this.revocations.findByUserId(payload.sub),
    );
    if (isRevoked(revocation, payload.ver)) throw new UnauthorizedException();
    return payload;
  }
}
