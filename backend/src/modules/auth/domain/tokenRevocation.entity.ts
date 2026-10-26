import { authConfig } from "@modules/auth/auth.config";
import { FPF, O } from "@shared/utils/application/monads";
import { UUID } from "@shared/uuid/uuid";
import { z } from "zod";

/**
 * A user's revoked access tokens: those carrying a version below
 * `tokenVersion`. Kept until `expiresAt`, when the last of them has expired
 * by itself.
 */
export const TokenRevocation = z.object({
  userId: UUID,
  tokenVersion: z.number().int().min(0),
  expiresAt: z.date(),
});

export type TokenRevocation = z.infer<typeof TokenRevocation>;

/** The revocation of the access tokens issued until `at`, when the user's
 * token version became `tokenVersion`. */
export const revokeAccessTokens = (
  userId: string,
  tokenVersion: number,
  at: Date,
): TokenRevocation => ({
  userId,
  tokenVersion,
  expiresAt: new Date(at.getTime() + authConfig.accessTokenTtl * 1000),
});

/** Whether the user's revocation, if any, refuses an access token of the
 * version; tokens issued before they carried one count as version 0. */
export const isRevoked = (
  revocation: O.Option<TokenRevocation>,
  tokenVersion = 0,
): boolean =>
  FPF.pipe(
    revocation,
    O.exists((revoked) => tokenVersion < revoked.tokenVersion),
  );
