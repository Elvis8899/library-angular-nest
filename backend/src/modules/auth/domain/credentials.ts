import { LoginRequest, RefreshTokenRequest } from "@library/contracts";
import { UUID } from "@shared/uuid/uuid";
import { z } from "zod";

export const LoginInput = LoginRequest;

export const RefreshTokenInput = RefreshTokenRequest;

// Claims of a verified refresh token that refreshing relies on
export const RefreshTokenClaims = z.object({
  sub: UUID,
  ver: z.number().int(),
  sid: UUID,
  jti: UUID,
});

export type RefreshTokenClaims = z.infer<typeof RefreshTokenClaims>;
