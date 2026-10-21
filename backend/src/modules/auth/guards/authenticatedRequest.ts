import { UserRoleEnum } from "@modules/user/domain/user.entity";

/** The claims of a verified access token. */
export type RequestJWTPayload = {
  sub: string;
  email: string;
  role: UserRoleEnum;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
};

/** A request that passed AuthGuard, which sets its user from the token. */
export type AuthenticatedRequest = {
  headers: { authorization?: string };
  user: RequestJWTPayload;
};
