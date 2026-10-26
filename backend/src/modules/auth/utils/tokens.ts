import { AuthResponse } from "@library/contracts";
import { authConfig } from "@modules/auth/auth.config";
import { User } from "@modules/user/domain/user.entity";
import { JwtService, JwtSignOptions, JwtVerifyOptions } from "@nestjs/jwt";

export const getSignTokenParams = (
  sub: string,
  payload: object,
): {
  payload: object;
  signOptions: JwtSignOptions;
  refreshOptions: JwtSignOptions;
} => {
  return {
    payload: {
      sub,
      ...payload,
    },
    signOptions: {
      audience: authConfig.audience,
      issuer: authConfig.issuer,
      secret: authConfig.secret,
      expiresIn: authConfig.accessTokenTtl,
    },
    refreshOptions: {
      audience: authConfig.audience,
      issuer: authConfig.issuer,
      secret: authConfig.refreshSecret,
      expiresIn: authConfig.refreshTokenTtl,
    },
  };
};

export const refreshVerifyOptions: JwtVerifyOptions = {
  audience: authConfig.audience,
  issuer: authConfig.issuer,
  secret: authConfig.refreshSecret,
};

/** Identifies the refresh token to issue: its session and its jti. */
export type RefreshTokenRef = { sessionId: string; jti: string };

/** Expiration of a refresh session issued or rotated now. */
export const refreshSessionExpiry = (): Date =>
  new Date(Date.now() + authConfig.refreshTokenTtl * 1000);

export const generateTokens =
  (jwtService: JwtService) =>
  async (
    user: User,
    { sessionId, jti }: RefreshTokenRef,
  ): Promise<AuthResponse> => {
    const { payload, signOptions, refreshOptions } = getSignTokenParams(
      user.id,
      {
        email: user.email,
        role: user.role,
        // AuthGuard refuses a version a revocation went past
        ver: user.tokenVersion,
      },
    );
    const [accessToken, refreshToken] = await Promise.all([
      jwtService.signAsync(payload, signOptions),
      // The token version lets the server revoke all the user's refresh
      // tokens; the session and jti make each refresh token single-use
      jwtService.signAsync({ ...payload, sid: sessionId, jti }, refreshOptions),
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
  };
