import { Email } from "@modules/user/domain/email";
import { UUID } from "@shared/uuid/uuid";
import { z } from "zod";

export const LoginInput = z.object({
  email: Email,
  password: z.string().min(1),
});

export const RefreshTokenInput = z.object({
  refreshToken: z.string().min(1),
});

// Claims of a verified refresh token that refreshing relies on
export const RefreshTokenClaims = z.object({
  sub: UUID,
  ver: z.number().int(),
  sid: UUID,
  jti: UUID,
});

export type RefreshTokenClaims = z.infer<typeof RefreshTokenClaims>;
