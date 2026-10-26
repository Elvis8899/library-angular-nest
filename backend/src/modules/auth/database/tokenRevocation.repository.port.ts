import { TokenRevocation } from "@modules/auth/domain/tokenRevocation.entity";
import { O, TE } from "@shared/utils/application/monads";

/**
 * The revocations AuthGuard checks. UserRepository.revokeTokens writes
 * them, with the token version they come from.
 */
export abstract class TokenRevocationRepository {
  findByUserId!: (
    userId: string,
  ) => TE.TaskEither<Error, O.Option<TokenRevocation>>;
}
