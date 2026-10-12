import { authConfig } from "@auth/auth.config";
import { AuthResponseDto } from "@auth/dtos/authResponse.dto";
import { JwtService, JwtSignOptions, JwtVerifyOptions } from "@nestjs/jwt";
import { User } from "@user/domain/user.entity";
import * as bcrypt from "bcrypt";

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

export const generateTokens =
  (jwtService: JwtService) =>
  async (user: User): Promise<AuthResponseDto> => {
    const { payload, signOptions, refreshOptions } = getSignTokenParams(
      user.id,
      {
        email: user.email,
        role: user.role,
      },
    );
    const [accessToken, refreshToken] = await Promise.all([
      jwtService.signAsync(payload, signOptions),
      // The token version lets the server revoke refresh tokens
      jwtService.signAsync(
        { ...payload, ver: user.tokenVersion },
        refreshOptions,
      ),
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

export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};
