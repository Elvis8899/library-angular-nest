import { UUID } from "@shared/uuid/uuid";
import { UserRoleEnum } from "@user/domain/user.entity";
import { z } from "zod";

export const LoginInput = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type User = z.infer<typeof LoginInput>;

export const RefreshTokenInput = z.object({
  refreshToken: z.string().min(1),
});

export type RequestJWTPayload = {
  sub: string;
  email: string;
  role: UserRoleEnum;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
};

// Claims of a verified refresh token that refreshing relies on
export const RefreshTokenClaims = z.object({
  sub: UUID,
  ver: z.number().int(),
  sid: UUID,
  jti: UUID,
});

export type RefreshTokenClaims = z.infer<typeof RefreshTokenClaims>;

export type AuthenticatedRequest = {
  user: RequestJWTPayload;
};
