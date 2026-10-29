import { UserRoleEnum } from "@modules/user/domain/user.entity";

/** The claims of a verified access token. */
export interface RequestJWTPayload {
  sub: string;
  email: string;
  role: UserRoleEnum;
  // The user's token version when it was issued; absent from tokens issued
  // before access tokens carried it
  ver?: number;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}

/** A request that passed AuthGuard, which sets its user from the token. */
export interface AuthenticatedRequest {
  headers: { authorization?: string };
  user: RequestJWTPayload;
}
