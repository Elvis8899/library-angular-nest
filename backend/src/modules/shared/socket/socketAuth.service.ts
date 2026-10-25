import { RequestJWTPayload } from "@modules/auth/guards/authenticatedRequest";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { z } from "zod";

const HandshakeAuth = z.object({ token: z.string().min(1) });

@Injectable()
export class SocketAuthService {
  constructor(private jwtService: JwtService) {}

  /**
   * The claims of the access token a handshake sends (`auth.token`),
   * verified as AuthGuard does, with the JwtModule's secret, audience and
   * issuer. Rejects a missing or invalid token.
   */
  async authenticate(handshakeAuth: unknown): Promise<RequestJWTPayload> {
    const auth = HandshakeAuth.safeParse(handshakeAuth);
    if (!auth.success) throw new UnauthorizedException();
    return this.jwtService.verifyAsync<RequestJWTPayload>(auth.data.token);
  }
}
