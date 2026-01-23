import { JwtSignOptions } from "@nestjs/jwt";
import { authConfig } from "../auth.config";
import * as bcrypt from "bcrypt";

export const getSignTokenParams = <T extends object>(
  sub: string,
  payload: T,
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

export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};
