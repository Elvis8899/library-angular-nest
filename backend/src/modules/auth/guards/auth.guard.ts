import { TokenRevocationRepository } from "@modules/auth/database/tokenRevocation.repository.port";
import { isRevoked } from "@modules/auth/domain/tokenRevocation.entity";
import {
  AuthenticatedRequest,
  RequestJWTPayload,
} from "@modules/auth/guards/authenticatedRequest";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { executeTask } from "@shared/utils/application/executeTask";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private revocations: TokenRevocationRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    // Verified with the JwtModule's secret, audience and issuer
    const payload = await this.jwtService
      .verifyAsync<RequestJWTPayload>(token)
      .catch(() => {
        throw new UnauthorizedException();
      });
    // A token revoked since (logout, deactivation, a change of password,
    // email or role) is refused before it expires. A failed read is a 500
    const revocation = await executeTask(
      this.revocations.findByUserId(payload.sub),
    );
    if (isRevoked(revocation, payload.ver)) throw new UnauthorizedException();
    // The route handlers read the claims from the request
    request.user = payload;
    return true;
  }

  private extractTokenFromHeader(
    request: AuthenticatedRequest,
  ): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
