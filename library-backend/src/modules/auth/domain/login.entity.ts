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

export type RefreshJWTPayload = RequestJWTPayload & {
  ver?: number;
};

export type AuthenticatedRequest = {
  user: RequestJWTPayload;
};
